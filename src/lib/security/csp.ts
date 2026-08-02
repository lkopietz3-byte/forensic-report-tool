// Content-Security-Policy builder. Lives here (not next.config) because the
// strict variant carries a PER-REQUEST nonce that only middleware can mint.
//
// Two variants share one directive set, differing only in script-src:
//   • nonceCsp  — script-src 'self' 'nonce-…' 'wasm-unsafe-eval'  (NO unsafe-inline)
//   • staticCsp — script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'
//
// We keep 'self' (no 'strict-dynamic') deliberately: every script is same-origin
// (no CDN), and 'strict-dynamic' would nullify 'self' and risk the self-hosted
// Tesseract/pdfjs worker script loading. The nonce's only job is to authorize
// Next.js's inline hydration scripts so we can drop 'unsafe-inline' from
// script-src on the routes that handle case data.

/**
 * connect-src must allow the browser Supabase client to reach the project
 * origin — magic-link sign-in (signInWithOtp) is a CLIENT-side fetch to
 * https://<project>.supabase.co, which bare 'self' would block, silently
 * breaking auth in production (CSP is off in dev). Derive the origin (and its
 * wss:// realtime form) from NEXT_PUBLIC_SUPABASE_URL when configured.
 */
function connectSrc(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return "connect-src 'self'";
  try {
    const origin = new URL(url).origin;
    const wss = origin.replace(/^https:/, "wss:");
    return `connect-src 'self' ${origin} ${wss}`;
  } catch {
    return "connect-src 'self'";
  }
}

function build(scriptSrc: string, styleElem: string): string {
  return [
    "default-src 'self'",
    scriptSrc,
    // pdfjs + Tesseract run in same-origin Web Workers (blob: fallback).
    "worker-src 'self' blob:",
    // Tailwind v4 ships a LINKED stylesheet in prod and our components use no
    // inline <style> elements, so style-src-elem drops 'unsafe-inline' on the
    // nonce'd routes (blocks an injected <style>). style-src-attr keeps
    // 'unsafe-inline' for any runtime React style attributes; style-src is the
    // fallback for browsers without the granular directives.
    `style-src-elem ${styleElem}`,
    "style-src-attr 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    connectSrc(),
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/** 'wasm-unsafe-eval' = WASM compilation only (the OCR engine), NOT eval(). */
const WASM = "'wasm-unsafe-eval'";

/** Strict CSP for case-data routes: inline scripts/styles must carry this nonce. */
export function nonceCsp(nonce: string): string {
  return build(`script-src 'self' 'nonce-${nonce}' ${WASM}`, `'self' 'nonce-${nonce}'`);
}

/** Fallback CSP for statically-rendered marketing pages (no per-request nonce). */
export function staticCsp(): string {
  // Static pages can't carry a nonce, so style-src-elem keeps 'unsafe-inline'.
  return build(`script-src 'self' 'unsafe-inline' ${WASM}`, `'self' 'unsafe-inline'`);
}

/**
 * Routes that handle authenticated/case data and are dynamically rendered, so a
 * per-request nonce can actually be applied to their scripts. Static marketing
 * pages are intentionally excluded — a nonce can't be threaded into HTML that
 * was rendered at build time, and they carry no user data.
 */
export function isSensitivePath(pathname: string): boolean {
  return /^\/(workspace|intake|verify|signin|auth)(\/|$)/.test(pathname);
}
