# Audit Scope: Application & API Security — all route handlers under src/app/api, input validation, error handling, file persistence, anti-abuse posture, and security header posture for Disclosed. Phase 0.

---

## Findings

---

[SEVERITY: Critical] No rate limiting on POST /api/waitlist — trivial spam, enumeration, and cost amplification

**Problem:** `src/app/api/waitlist/route.ts` has no rate limit, no IP throttle, and no request budget. Any unauthenticated caller can POST to `/api/waitlist` at arbitrary speed with no consequence. Three distinct attack vectors follow:
1. **Spam / list poisoning:** Thousands of synthetic signups pollute the waitlist dataset that informs design-partner outreach.
2. **Email enumeration:** The Supabase path calls `upsert(..., { onConflict: "email", ignoreDuplicates: true })`. Because `ignoreDuplicates: true` suppresses the unique-constraint error and always returns HTTP 200 `{ ok: true }`, the response itself does *not* reveal duplicate status — but an attacker can still enumerate by timing or by switching to the file-fallback path (below). The file path uses `fs.appendFile` unconditionally with no dedup check, so a duplicate email in file mode produces a duplicate JSONL line, making frequency a signal.
3. **Honeypot-bypass cost amplification:** A determined bot that leaves `company` empty can force one Supabase `upsert` call or one `fs.appendFile` per request. At scale this inflates disk usage and exhausts the Supabase free-tier row write budget. This market (reputation-sensitive forensic experts) will interpret any press about "Disclosed. waitlist hacked / spammed" as terminal.

**Concrete fix:** Add a lightweight in-edge rate limiter before any persistence. Because there is no middleware.ts yet (confirmed: no file exists), the cleanest zero-dependency approach is an in-route check using a module-level `Map` as a sliding-window counter, or — better for multi-instance deploy — add `@upstash/ratelimit` + `@upstash/redis` (both free tier). Implement in `src/app/api/waitlist/route.ts` at the top of `POST`, before `parseWaitlistInput`:

```ts
// Minimal in-process limiter (single-instance / dev):
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const ipCounts = new Map<string, { count: number; reset: number }>();

function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now > entry.reset) {
    ipCounts.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_PER_WINDOW;
}
```

Then inside `POST`:
```ts
const ip =
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
if (!rateLimitOk(ip)) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
```

For production, replace with Upstash sliding-window. Also add Next.js `export const config = { api: { bodyParser: { sizeLimit: "4kb" } } }` (see body-size finding below).

---

[SEVERITY: High] Zod validation error response leaks honeypot field name to clients

**Problem:** `src/app/api/waitlist/route.ts` lines 37–41 return the full `parsed.error.flatten()` object on validation failure:
```ts
return NextResponse.json(
  { error: "Invalid input", issues: parsed.error.flatten() },
  { status: 400 },
);
```
`flatten()` produces `{ fieldErrors: { email: [...], company: [...] }, formErrors: [] }`. Returning `fieldErrors.company` reveals that `company` is the honeypot field name. A bot that receives a 400 with `company: "String must contain at most 0 character(s)"` learns it must submit `company` as an empty or omitted value to bypass the honeypot. This effectively hands attackers the honeypot specification.

**Why it matters for this market:** Forensic experts evaluating the platform will conduct basic OSINT. Discovering that the anti-spam mechanism is self-documenting in error responses undermines trust in the platform's defensive posture.

**Concrete fix:** In `src/app/api/waitlist/route.ts`, never echo `issues` to the client. Replace the 400 response with a generic message:
```ts
return NextResponse.json({ error: "Invalid input" }, { status: 400 });
```
If client-side field-level feedback is needed, implement it exclusively in the Zod schema in `src/lib/waitlist/schema.ts` before the fetch is ever sent (it already runs client-side per the comment on line 3–4 of that file).

---

[SEVERITY: High] No security headers — no CSP, no X-Frame-Options, no X-Content-Type-Options

**Problem:** `next.config.mjs` contains only `reactStrictMode: true`. There is no `headers()` export and no `middleware.ts`. As a result all responses (including API routes) lack:
- `Content-Security-Policy`: allows inline scripts, arbitrary third-party frames, and data: URIs — widens XSS blast radius.
- `X-Frame-Options: DENY`: the landing page and /app workspace can be clickjacked inside a malicious iframe.
- `X-Content-Type-Options: nosniff`: browser MIME sniffing on served files (future uploads).
- `Referrer-Policy: strict-origin-when-cross-origin`: referrer leakage on external links.
- `Strict-Transport-Security` (HSTS): allows downgrade in transit.

**Why it matters:** Forensic case data — depositions, wage records, medical records — will eventually transit through this app. Courts and clients will scrutinize security posture. The landing page itself claims "Encryption in transit and at rest" — absent HSTS this claim is weakened.

**Concrete fix:** Add a `headers()` function to `next.config.mjs`:
```js
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Tighten CSP before launch; this starter blocks framing and data: URIs.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'", // tighten to nonce-based before beta
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://*.supabase.co",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};
```

---

[SEVERITY: High] No request body size limit — unbounded memory allocation per POST

**Problem:** `src/app/api/waitlist/route.ts` calls `await request.json()` with no prior size guard. Next.js App Router does not enforce a default body size limit on route handlers (unlike the Pages Router's 1 MB default for `bodyParser`). An attacker can POST a multi-megabyte JSON body; the Node.js process will buffer and parse the entire payload before the Zod validator ever runs. At scale this is a memory-exhaustion vector.

**Concrete fix:** Read `Content-Length` and reject early, or limit via streaming before `request.json()`:
```ts
export const config = { api: { bodyParser: { sizeLimit: "4kb" } } };
// App Router alternative: check Content-Length before parsing
const contentLength = request.headers.get("content-length");
if (contentLength && parseInt(contentLength, 10) > 4096) {
  return NextResponse.json({ error: "Request too large" }, { status: 413 });
}
```
4 KB is generous for a waitlist payload (email + discipline + source).

---

[SEVERITY: Medium] Validation issues response leaks internal field names generally (discipline enum values)

**Problem:** Beyond the honeypot leak, returning `parsed.error.flatten()` also reveals the full Zod schema surface: that `discipline` must be one of the enum values, the exact length constraint on `source` (120), and the email format rule. This is low-impact individually but constitutes unnecessary information disclosure for a conservative, privacy-sensitive market.

**Concrete fix:** Same as the honeypot finding — drop `issues` from the 400 response entirely. Trust the client-side schema for user-facing feedback.

---

[SEVERITY: Medium] File-persistence path (.data/waitlist.jsonl) has no concurrent-write safety and unbounded growth

**Problem:** `src/app/api/waitlist/route.ts` lines 15–26 use `fs.appendFile` (an async operation) with no file lock, no deduplication check, and no rotation logic. Under concurrent traffic:
1. Two simultaneous POSTs with the same email can both pass the `supabaseConfigured()` check as false and both append — producing duplicate records.
2. The file grows without bound. There is no rotation, max-line count, or size cap. In a sustained spam attack the .data directory can fill the deployment filesystem.
3. `process.cwd()` in a serverless/containerized deployment may not be writable, causing unhandled errors at `fs.mkdir`.

**Why it matters:** In local dev this is acceptable. If `.env.local` is missing Supabase credentials on a staging or production server the fallback silently activates, meaning production data goes to a local file with these weaknesses.

**Concrete fix:**
- Add a guard that explicitly disables the file path in non-development environments:
```ts
async function persistToFile(email: string, discipline?: string, source?: string) {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("File persistence is not allowed outside development. Configure Supabase.");
  }
  // ... existing logic
}
```
- In the `POST` handler, treat a missing Supabase config in production as a 503 rather than silently falling back:
```ts
if (!supabaseConfigured()) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  await persistToFile(email, discipline, source);
}
```

---

[SEVERITY: Medium] Health endpoint leaks internal service name, phase, and server clock

**Problem:** `src/app/api/health/route.ts` returns `{ status, service: "forensic-report-tool", phase: 0, time: <ISO timestamp> }` publicly. The `service` and `phase` fields are minor reconnaissance aids (version enumeration, architecture fingerprinting). The `time` field exposes the server's precise clock, which can assist timing attacks. The endpoint has no authentication, no rate limit, and no method restriction beyond the implicit GET-only export.

**Why it matters:** Low impact for a waitlist phase, but a habit to fix before client data enters the system.

**Concrete fix:** Reduce to `{ status: "ok" }`. Remove `service`, `phase`, and `time`. If uptime monitoring needs latency, the monitoring system itself should track round-trip time without the server self-reporting it.

---

[SEVERITY: Medium] No CSRF protection on state-changing POST endpoint

**Problem:** `POST /api/waitlist` is a state-changing endpoint (writes to Supabase or disk) with no CSRF token, no `SameSite` cookie check (there are no cookies at all), and no `Origin`/`Referer` validation. Because Next.js App Router does not issue cookies for public API routes, the CSRF risk here is low in Phase 0 (the endpoint is intentionally unauthenticated), but the pattern will be copy-pasted into future authenticated drafting endpoints where CSRF is a real threat.

**Why it matters:** The drafting endpoints that will accept litigation-sensitive evidence uploads are one copy-paste away from this unguarded handler. Forensic expert users do not expect cross-origin state mutations on their case files.

**Concrete fix for this endpoint:** At minimum, validate the `Origin` or `Referer` header matches the app's origin (or reject requests that lack both):
```ts
const origin = request.headers.get("origin");
const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"];
if (origin && !allowedOrigins.includes(origin)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```
For future authenticated endpoints: use `SameSite=Lax` session cookies + a CSRF token header (`X-CSRF-Token`), or use Next.js Server Actions (which have built-in CSRF protection via the `Origin` check in the framework).

---

[SEVERITY: Medium] No HTTP method guard on /api/waitlist — GET/PUT/DELETE all reach route logic

**Problem:** `src/app/api/waitlist/route.ts` exports only `POST`, so Next.js returns 405 for other methods automatically. However, there is no explicit `export const dynamic` or explicit method allowlist. The health route correctly declares `export const dynamic = "force-dynamic"` but the waitlist route does not. In Next.js 15 App Router, a missing `dynamic` setting may allow the POST handler to be statically optimized or cached under certain configurations. Additionally, HEAD and OPTIONS requests are handled automatically by Next.js but the handler does not set explicit `Allow` headers.

**Concrete fix:** Add `export const dynamic = "force-dynamic"` to `src/app/api/waitlist/route.ts` (same as the health route) to ensure no response caching occurs for the stateful POST.

---

[SEVERITY: Low] Honeypot field name is visible in React component source

**Problem:** `src/app/_components/Waitlist.tsx` names the honeypot state variable `company` and the input `id={${emailId}-company}` in the rendered HTML. Although the field is visually hidden, the field name `company` is present in the compiled client bundle and visible to any developer inspecting the source. Sophisticated bots using headless browsers already know to inspect source.

**Why it matters:** The honeypot is the only anti-spam mechanism. Its name being predictable from bundle inspection reduces its efficacy over time.

**Concrete fix:** Rename the honeypot field to a neutral, non-obvious name in both the schema (`src/lib/waitlist/schema.ts`) and the component (`src/app/_components/Waitlist.tsx`), e.g. `website` or `phone2`. Do not use names that describe their purpose (`honeypot`, `trap`, `bot_check`). Also add `autocomplete="off"` and a 250ms minimum submission-time check on the client (bots fill and submit instantly; humans take seconds) as a second layer.

---

[SEVERITY: Low] `source` field in waitlist payload is user-controlled and stored verbatim

**Problem:** `src/lib/waitlist/schema.ts` validates `source` as `z.string().trim().max(120).optional()`. The `source` field is populated from the `id` prop of the `<Waitlist>` component, which comes from the page (`id="waitlist-hero"`, `id="waitlist"`). However, because the API accepts arbitrary JSON, any caller can set `source` to any 120-character string. This value is stored verbatim in Supabase and in the JSONL file. It is displayed to the operator (you) in outreach tooling. A malicious actor could inject content intended to confuse the CRM import (e.g., CSV injection if the JSONL is ever exported to CSV) or inject tracking/analytics identifiers.

**Concrete fix:** Either restrict `source` to a fixed enum of known page identifiers, or sanitize/allowlist against a known set server-side. In `src/lib/waitlist/schema.ts`:
```ts
const KNOWN_SOURCES = ["waitlist-hero", "waitlist", "sample", "app"] as const;
source: z.enum(KNOWN_SOURCES).optional(),
```

---

[SEVERITY: Low] Future drafting/upload API endpoints will need explicit auth enforcement before they are wired

**Problem:** The schema (`src/lib/domain/types.ts`, `supabase/migrations/0001_init.sql`) and the Anthropic drafting pipeline (`src/lib/draft/pipeline.ts`, `src/lib/draft/anthropic.ts`) are built and functional. No route handlers for `/api/draft/*` or `/api/upload/*` exist yet. When these are added, the established pattern (no middleware.ts, no auth check in the route) will be the default reference. Given that forensic case evidence is often under federal protective order, an unguarded drafting endpoint that lets unauthenticated callers submit evidence to the Anthropic API and receive drafts would be a Critical finding.

**Concrete fix (pre-emptive):** Before wiring any drafting endpoint, create `src/middleware.ts` to enforce Supabase session presence on all `/app/*` and `/api/draft/*` paths. Draft the middleware now while the codebase is small:
```ts
// src/middleware.ts
import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // TODO: replace with real Supabase session check once auth is wired.
  // Stub that blocks all /api/draft and /app paths from unauthenticated access.
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/draft") || pathname.startsWith("/api/upload")) {
    // Block until auth is wired
    return NextResponse.json({ error: "Not implemented" }, { status: 501 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/draft/:path*", "/api/upload/:path*", "/app/:path*"],
};
```

---

## Top 3 Must-Fix

1. **[Critical] Add rate limiting to POST /api/waitlist** — The endpoint is fully open to spam flooding, email enumeration, and Supabase write-budget exhaustion. This is the highest-cost risk relative to fix effort: a 20-line in-process sliding-window counter in `src/app/api/waitlist/route.ts` reduces spam risk immediately, with Upstash as a follow-on for multi-instance deploy.

2. **[High] Remove Zod `issues` from the 400 response** — Returning `parsed.error.flatten()` teaches attackers the exact field name and constraint of the honeypot, neutralizing the only existing anti-spam mechanism. One-line fix in `src/app/api/waitlist/route.ts`: drop `issues` from the JSON body.

3. **[High] Add security headers in next.config.mjs** — No CSP, no X-Frame-Options, and no HSTS. The landing page claims "encryption in transit" and is targeting a market that will be adversarially cross-examined on security claims. A `headers()` block in `next.config.mjs` costs ~20 lines and delivers X-Frame-Options, nosniff, HSTS, and a baseline CSP before the first design partner sees the URL.
