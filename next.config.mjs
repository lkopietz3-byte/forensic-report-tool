/** @type {import('next').NextConfig} */

// ─── Content-Security-Policy ────────────────────────────────────────────────
// CSP is NOT set here anymore — it's owned by src/middleware.ts so the case-data
// routes (/workspace, /signin, /auth) can carry a PER-REQUEST nonce in
// script-src instead of 'unsafe-inline'. See src/lib/security/csp.ts for the
// directive set. The remaining (static) security headers below still apply to
// every route via headers().

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  // 1-year HSTS on the apex (safe on an HTTPS-only host like Vercel). Add
  // `; includeSubDomains; preload` and submit to hstspreload.org only after
  // EVERY subdomain is verified HTTPS-only — those flags are hard to undo.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()",
  },
  // Isolate the browsing context and cross-origin resource sharing so case
  // content can't be probed via cross-origin window references or hot-linking.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // X-XSS-Protection is deliberately omitted: the legacy auditor it enables is
  // deprecated and can itself introduce cross-site leaks. CSP is the real
  // defense (modern OWASP guidance).
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // pdfkit reads its built-in font-metric (.afm) files from disk at runtime.
  // Bundling it through webpack drops those assets and breaks PDF export, so
  // keep it external and required straight from node_modules on the server.
  serverExternalPackages: ["pdfkit"],

  // The PDF renderer embeds vendored TTFs (Source Serif 4 + Inter) read from
  // disk at runtime via fs.readFileSync. Next's build tracer can't see those
  // dynamic paths, so name them explicitly or they get dropped from the
  // standalone bundle and PDF export falls back / fails.
  outputFileTracingIncludes: {
    "/api/export/sample/pdf": ["./src/lib/export/fonts/**"],
    // The REAL deliverable route renders a PDF too (format=pdf), so it needs the
    // same vendored TTFs traced into its function bundle — without this, PDF
    // export of an actual report throws ENOENT at fs.readFileSync in prod while
    // the sample PDF works, so the bug hides until the first paying export.
    "/api/report/export": ["./src/lib/export/fonts/**"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Never let a browser or CDN edge cache authentication, case-data, or
      // disclosure-verification surfaces. This is explicit defense in depth in
      // addition to dynamic rendering and route-level no-store responses.
      {
        source: "/workspace",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/intake",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/verify",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/signin",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/auth/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/api/intake/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/api/draft/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/api/report/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/api/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/app/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
