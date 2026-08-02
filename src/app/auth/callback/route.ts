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

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, url.origin));
      }
    }
  }

  return NextResponse.redirect(
    new URL("/signin?error=link", url.origin),
  );
}
