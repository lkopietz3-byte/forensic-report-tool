# Audit 03 — Secrets & Configuration Hygiene

**Scope:** .env handling, service-role key isolation, NEXT_PUBLIC_ discipline, PII at rest in .data/, accidental logging, Anthropic/Stripe key handling.

---

## Findings

### [HIGH] `console.error("waitlist persist failed", err)` leaks Supabase error details to server logs — `src/app/api/waitlist/route.ts:66`
The raw Supabase `error` object is passed directly to `console.error`. In production, Supabase client errors include the full error message, hint, and sometimes connection details (e.g., "invalid JWT", "role does not exist", hostname). In managed hosting (Vercel, Railway), these logs are often retained and accessible to team members or support staff. Fix: log only `err instanceof Error ? err.message : String(err)` — never the raw object — and strip any field that echoes back user input.

### [MEDIUM] `src/lib/draft/anthropic.ts` lacks a `server-only` guard
`server.ts` (Supabase service-role client) correctly imports `server-only` at line 1, producing a build error if a client component imports it. `anthropic.ts` does not. The `ANTHROPIC_API_KEY` is accessed via `process.env.ANTHROPIC_API_KEY` which Next.js will silently make `undefined` in the browser bundle rather than erroring — meaning a developer could accidentally wire `AnthropicClient` into a client component, the key would silently be missing, and the error would only surface at runtime. More critically, if `opts.apiKey` is ever passed as a prop (no check), the key could be included in client-side JS. Fix: add `import "server-only";` as the first line of `anthropic.ts`.

### [MEDIUM] `.env.production` / `.env.staging` variants are not explicitly gitignored — gap in `.gitignore`
`.gitignore` covers `.env` and `.env*.local` but not `.env.production`, `.env.staging`, or `.env.development` (the non-`.local` forms). Next.js loads these files automatically. A developer who populates `.env.production` with real keys (common practice) would unknowingly commit them. Fix: add `.env.*` (or explicit `.env.production`, `.env.staging`, `.env.development`) to `.gitignore`.

### [LOW] PII at rest in `.data/waitlist.jsonl` — plaintext emails, no retention policy, correctly gitignored
`.data/` is properly gitignored and the directory is empty in the current repo snapshot. However, the fallback file-persistence path writes plaintext email addresses with no encryption, no retention window, and no deletion path. This file lives in the app's working directory and would be readable by anyone with server filesystem access (container escapes, shared hosting). Pre-launch this is tolerable, but must be resolved before real signups: migrate fully to Supabase (RLS + encryption at rest), or encrypt the JSONL file at the application layer. Add a documented retention policy (e.g., 90-day auto-delete).

### [LOW] `NEXT_PUBLIC_SUPABASE_URL` used in `server.ts` (service-role client) — cosmetically confusing, not a security issue
`server.ts` reads `NEXT_PUBLIC_SUPABASE_URL`, which is a public-prefix var. The URL itself is not secret (it's a public Supabase endpoint), so no confidentiality is lost. However, it's architecturally confusing — a future developer might see `NEXT_PUBLIC_` in a `server-only` file and either (a) question whether the guard is needed or (b) incorrectly assume they can read any `NEXT_PUBLIC_` var from the service client. Consider aliasing `SUPABASE_URL` (no public prefix) for the server client; set both in `.env.example` with a comment explaining the URL is public but the alias makes intent clear.

### [INFO] No real secrets committed — repo hygiene is clean
Broad grep for key patterns (`sk-ant-`, `AKIA`, JWT tokens, `eyJh…`) returned zero hits in committed source. `.env.local` is gitignored and absent. `.data/` is gitignored and empty. `.env.example` contains only placeholder empty values. No Stripe or Anthropic keys in any tracked file.

### [INFO] `server-only` package is a production dependency — correct
`server-only` is listed in `dependencies` (not `devDependencies`), ensuring the build-time guard is enforced in CI and production builds, not just local development.

### [INFO] Stripe keys not yet wired into any source file
`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` appear only in `.env.example`. No source file imports or reads them. When Stripe is implemented, ensure it's behind `server-only` (or inside API routes only) and that the webhook handler verifies the `Stripe-Signature` header before processing any event.

### [INFO] `AnthropicClient` not yet imported in any client component
Currently `AnthropicClient` is only defined in `src/lib/draft/anthropic.ts` and not imported anywhere else in the codebase. The `server-only` gap is a latent risk, not a live exposure. Adding the guard now costs nothing.

---

## Top 3 Must-Fix Before Launch

1. **[HIGH] Strip raw Supabase error objects from `console.error` in the waitlist route.** Server log leakage of connection details is the most immediate exploitable risk.
2. **[MEDIUM] Add `import "server-only";` to `src/lib/draft/anthropic.ts`** before any API route or server action starts using it, to prevent the Anthropic API key from ever being reachable in client bundle paths.
3. **[MEDIUM] Expand `.gitignore` to cover `.env.production` / `.env.staging` / `.env.development`.** A single `git add .` by a developer using non-`.local` env files would silently commit real credentials.

---

## Recommended Production Secret-Management Posture

- **Injection:** All secrets (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) via platform env vars (Vercel environment variables UI / Railway variables), never in files on disk.
- **No service key in Edge Runtime:** Keep `runtime = "nodejs"` on all routes using the service-role client (currently done correctly). Edge runtime does not support the `server-only` guard the same way and has limited Node.js APIs.
- **Rotation plan:** Supabase service-role key should be rotated at least annually and on any personnel change. Anthropic key on any compromise signal. Document rotation runbook before first paying customer.
- **Stripe webhook secret:** Must be regenerated for each deployment endpoint (local vs. staging vs. production); never share across environments.
- **`.data/` fallback:** Treat as a temporary dev convenience only. Disable the file-fallback path entirely in production by requiring Supabase config (`supabaseConfigured()` returning false should 503, not silently write plaintext to disk).
