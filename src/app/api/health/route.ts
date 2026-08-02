import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { envPresence } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = {
  status: "ok" as const,
  service: "disclosed",
};

// Constant-time token comparison so the deep-check secret can't be guessed by
// timing the response. Returns false on any length/format mismatch.
function tokenMatches(provided: string | null): boolean {
  const expected = process.env.HEALTH_CHECK_TOKEN;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const deep =
    url.searchParams.get("deep") === "1" &&
    // Secrets in query strings leak into browser history, proxy/CDN access
    // logs, analytics, and referrers. The deep-check token is header-only.
    tokenMatches(request.headers.get("x-health-token"));

  return NextResponse.json({
    ...BASE,
    time: new Date().toISOString(),
    // Presence booleans only (never values), and only for an authenticated
    // caller — so this can answer "is prod configured?" without leaking secrets.
    ...(deep ? { env: envPresence() } : {}),
  });
}
