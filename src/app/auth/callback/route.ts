import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { safeInternalPath } from "@/lib/http/redirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Magic-link landing. Supabase emails a link back here with a one-time `code`;
// we exchange it for a session cookie, then send the expert to their workspace.
// `next` is validated to a local path so the redirect can't be used as an open
// redirect.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeInternalPath(url.searchParams.get("next"));

  try {
    if (code) {
      const supabase = await createSupabaseServerClient({ requireCookieWrites: true });
      if (supabase) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          // A relative Location preserves the browser origin when Next uses an
          // internal hostname behind a proxy (including the local dev server).
          return new NextResponse(null, { status: 307, headers: { Location: next } });
        }
      }
    }
  } catch {
    return NextResponse.json({ error: "Sign-in could not be completed. Please try signing in again." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return new NextResponse(null, {
    status: 307,
    headers: { Location: "/signin?error=link" },
  });
}
