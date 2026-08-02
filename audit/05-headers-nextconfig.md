# 05 — HTTP Security Headers & Content-Security-Policy

**Scope:** `next.config.mjs`, absence of `src/middleware.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/_components/Waitlist.tsx`.

---

## Findings

| Severity | Header / Issue | Gap | Risk |
|---|---|---|---|
| **CRITICAL** | Content-Security-Policy | Completely absent | XSS on a tool handling sensitive case files; a compromised CSP allows script injection that could exfiltrate case data silently |
| **CRITICAL** | X-Frame-Options / `frame-ancestors` | Completely absent | Any attacker can iframe the app; a forensic expert can be clickjacked into submitting case data to an attacker-controlled form |
| **HIGH** | Strict-Transport-Security (HSTS) | Completely absent | Downgrade / MITM attacks against users who type the URL; case data transits over plain HTTP on first visit if user has never visited |
| **HIGH** | X-Content-Type-Options: nosniff | Completely absent | Browser MIME-sniffing of uploaded evidence files could allow script execution |
| **MEDIUM** | Referrer-Policy | Absent; default leaks full URL | URL fragments / waitlist source params leak to any third-party resource loaded in future |
| **MEDIUM** | Permissions-Policy | Absent | Camera, microphone, geolocation, etc. are browser-grantable with no restriction; a forensic expert should never inadvertently grant these |
| **LOW** | Cache-Control (authenticated pages) | Not set | Once authenticated app pages exist, browsers and CDN edges may cache sensitive report content |

---

## CSP Compatibility Analysis (Next 15 + Tailwind v4)

### What the page actually loads
- **Styles:** Tailwind v4 via `@import "tailwindcss"` — this compiles to a single `<style>` block injected at build time (SSR) **or** a `<link>` tag depending on the build mode. In production (`next build`) Tailwind v4 outputs to a linked stylesheet; no inline `<style>` tags for Tailwind itself.
- **Inline styles:** The hero section uses a `radial-gradient` via a Tailwind utility class, **not** a raw `style=""` attribute. No `style=""` attributes found in any component.
- **Google Fonts:** None. Not used anywhere.
- **Third-party scripts:** None. No analytics, no Stripe, no Intercom.
- **Next.js runtime:** Next 15 injects a small inline `<script>` block for hydration data (`__NEXT_DATA__` / RSC payload). This **requires** `'unsafe-inline'` for scripts OR a nonce. It also loads JS chunks from `/_next/static/`.
- **Inline SVGs:** Multiple inline `<svg>` elements rendered directly in JSX — these are safe under a `img-src` or `default-src` that allows `data:` but do not need `script-src` allowances.
- **fetch() API calls:** `Waitlist.tsx` calls `fetch("/api/waitlist")` — same-origin only, no external `connect-src` needed beyond `'self'`.

### Nonce vs `'unsafe-inline'` tradeoff for Next 15

**Option A — `'unsafe-inline'` (simpler, acceptable for marketing pages):**
- Works out of the box with `next.config.mjs` `headers()`.
- Allows *any* inline script, so XSS via injected `<script>` tags is not blocked.
- Acceptable for a pre-launch marketing/waitlist page with no user-supplied content rendered server-side.
- **Not acceptable** once authenticated app pages with server-rendered case data exist.

**Option B — Nonce (recommended path, mandatory for authenticated app):**
- Requires `src/middleware.ts` to generate a per-request nonce, set it as a response header AND pass it to the page via `headers()` or a server component context so `<Script nonce={nonce}>` can be used.
- Next 15 does not auto-thread a nonce; you must implement this yourself.
- Eliminates `'unsafe-inline'` for scripts — the strongest protection.
- **Gotcha:** Next 15 HMR in development injects many inline scripts. You must either (a) skip the strict CSP in `NODE_ENV === 'development'`, or (b) use `'unsafe-inline'` only in dev. The ready-to-paste config below handles this.

**Recommendation:** Ship `'unsafe-inline'` now to unblock launch (marketing-only pages, no user content rendered server-side). Before the authenticated app launches, implement the nonce path via middleware.

---

## Top 3 Must-Fix Before Launch

1. **[CRITICAL] Add `X-Frame-Options: DENY` and `frame-ancestors 'none'`** — clickjacking on a legal tool is a reputational disaster. One line to fix.
2. **[CRITICAL] Add a Content-Security-Policy** — even a permissive starter CSP blocks drive-by injection. Use the config below.
3. **[HIGH] Add HSTS** — case data must never transit in cleartext. Set with a short `max-age` initially, ramp to 1 year + `includeSubDomains` after verifying all subdomains are HTTPS.

---

## Ready-to-Paste `next.config.mjs`

```js
/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development";

// ─── Content-Security-Policy ────────────────────────────────────────────────
// Tailwind v4 in Next 15 emits a linked stylesheet in production; no inline
// <style> tags for framework CSS. No Google Fonts, no third-party scripts.
// Next.js injects an inline <script> block for hydration — requires
// 'unsafe-inline' in script-src until you add a nonce via middleware.
//
// TODO (before authenticated app launch): replace 'unsafe-inline' with a
// per-request nonce generated in src/middleware.ts and threaded to next/script.
const csp = isDev
  ? "" // Disable CSP in dev: Next HMR uses eval() and many inline scripts
  : [
      "default-src 'self'",
      // Scripts: Next.js hydration blob requires 'unsafe-inline' for now.
      // Add 'unsafe-eval' only if you add a nonce and remove 'unsafe-inline'.
      "script-src 'self' 'unsafe-inline'",
      // Styles: Tailwind v4 outputs a linked stylesheet + possible inline style
      // attributes from radial-gradient utilities. 'unsafe-inline' for style-src
      // is low-risk (style injection ≠ script injection).
      "style-src 'self' 'unsafe-inline'",
      // Images: inline SVGs use data: URIs; allow self + data:
      "img-src 'self' data:",
      // Fonts: none external; self only
      "font-src 'self'",
      // Fetch targets: only same-origin API routes (/api/waitlist etc.)
      "connect-src 'self'",
      // Everything else: block
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Disallow being framed anywhere (belt-and-suspenders with X-Frame-Options)
      "frame-ancestors 'none'",
      // Upgrade any accidental mixed-content requests
      "upgrade-insecure-requests",
    ].join("; ");

const securityHeaders = [
  // ── Anti-clickjacking ────────────────────────────────────────────────────
  // frame-ancestors in CSP above is the modern standard; X-Frame-Options
  // covers older browsers that don't parse CSP frame-ancestors.
  {
    key: "X-Frame-Options",
    value: "DENY",
  },

  // ── Content-Security-Policy ──────────────────────────────────────────────
  // Only set in production; dev omits CSP to keep HMR working.
  ...(csp ? [{ key: "Content-Security-Policy", value: csp }] : []),

  // ── Transport security ───────────────────────────────────────────────────
  // Start with 1 hour (3600s) so you can recover quickly if a subdomain breaks.
  // Ramp to 31536000 (1 year) + includeSubDomains + preload after verification.
  // DO NOT add preload until you are certain all subdomains are HTTPS-only.
  {
    key: "Strict-Transport-Security",
    value: "max-age=3600",
  },

  // ── MIME sniffing ────────────────────────────────────────────────────────
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  // ── Referrer leakage ─────────────────────────────────────────────────────
  // Strict-origin-when-cross-origin: sends origin on same-origin, only origin
  // (not path) on cross-origin HTTPS, nothing on HTTP downgrade.
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  // ── Permissions / feature policy ─────────────────────────────────────────
  // A forensic tool has no legitimate use for camera, mic, geo, or payment.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },

  // ── XSS filter (legacy browsers) ─────────────────────────────────────────
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
];

const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        // Apply security headers to all routes.
        source: "/(.*)",
        headers: securityHeaders,
      },
      // ── Cache-Control for future authenticated pages ───────────────────
      // Uncomment and extend this block when /app/** routes go live.
      // Prevents browsers and CDN edges from caching sensitive case data.
      // {
      //   source: "/app/(.*)",
      //   headers: [
      //     {
      //       key: "Cache-Control",
      //       value: "no-store, max-age=0",
      //     },
      //   ],
      // },
    ];
  },
};

export default nextConfig;
```

---

## Next-Specific Gotchas

| Gotcha | Detail |
|---|---|
| **HMR breaks under strict CSP** | Next dev server uses `eval()` for source maps and injects many inline scripts for Fast Refresh. The config above disables CSP in `NODE_ENV === 'development'` to avoid wasted debugging. |
| **Nonce threading is manual in Next 15** | `next/headers` does not inject a nonce automatically. To use a nonce: generate it in `src/middleware.ts`, set it as a response header, read it in the root layout via `headers()` from `next/headers`, and pass it to `<Script nonce={nonce}>`. Remove `'unsafe-inline'` from `script-src` once the nonce is threaded. |
| **Tailwind v4 linked vs inline** | Tailwind v4 with `@import "tailwindcss"` in Next 15 outputs a linked `<link rel="stylesheet">` in production. No inline `<style>` tag is emitted for Tailwind CSS itself. The `'unsafe-inline'` in `style-src` covers any future component-level `style={}` props (none found currently), not Tailwind. |
| **`frame-ancestors` vs `X-Frame-Options`** | CSP `frame-ancestors 'none'` supersedes `X-Frame-Options` in modern browsers, but both are set here for defense-in-depth against legacy browsers used in legal/enterprise IT environments. |
| **HSTS preload ramp** | Do NOT add `preload` to the HSTS header until the domain is fully HTTPS-committed including all subdomains. Preload is a one-way door via the browser preload list. Start at `max-age=3600`, test for 30 days, then ramp to `max-age=31536000; includeSubDomains; preload`. |
| **`Cache-Control` for app pages** | Marketing pages can be cached freely. Once authenticated report-editing pages exist under `/app/`, add `Cache-Control: no-store` to prevent CDN edges or shared browsers from caching case-file content. The config includes a commented-out block ready to uncomment. |
