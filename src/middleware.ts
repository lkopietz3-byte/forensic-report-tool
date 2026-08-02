import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { nonceCsp, staticCsp, isSensitivePath } from "@/lib/security/csp";

// One middleware, two jobs: keep the Supabase session fresh, and own the CSP.
//
// CSP is set here (not next.config) so case-data routes can carry a PER-REQUEST
// nonce: we mint a nonce, put it on the request headers (Next reads it from the
// Content-Security-Policy request header and applies it to its inline scripts),
// and set the matching nonce CSP on the response — dropping 'unsafe-inline' from
// script-src there. Static marketing pages keep the inline-allowing CSP, since a
// per-request nonce can't be threaded into build-time HTML. CSP is skipped in
// dev (HMR relies on eval/inline).
export async function middleware(request: NextRequest) {
  // NEVER trust these from the client: Next.js reads the nonce out of the
  // Content-Security-Policy REQUEST header, so an inbound spoof must be
  // stripped before we (optionally) set our own values below.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-nonce");
  requestHeaders.delete("content-security-policy");

  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    return updateSession(request, { requestHeaders, cspHeader: null });
  }

  if (isSensitivePath(request.nextUrl.pathname)) {
    const nonce = btoa(crypto.randomUUID());
    const csp = nonceCsp(nonce);
    requestHeaders.set("x-nonce", nonce);
    // Next.js reads the nonce from THIS request header and applies it to the
    // scripts it renders.
    requestHeaders.set("Content-Security-Policy", csp);
    return updateSession(request, { requestHeaders, cspHeader: csp });
  }

  return updateSession(request, { requestHeaders, cspHeader: staticCsp() });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|opengraph-image|tesseract|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|wasm|traineddata|js\\.gz)$).*)",
  ],
};
