import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { isSameOriginRequest } from "@/lib/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-site request refused." }, { status: 403, headers });
  }
  try {
    const supabase = await createSupabaseServerClient({ requireCookieWrites: true });
    if (!supabase) throw new Error("Auth unavailable");
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch {
    // Provider details can contain session information. Return only a stable,
    // retryable failure; do not claim that the session has been terminated.
    return NextResponse.json({
      code: "SIGN_OUT_UNAVAILABLE",
      error: "Sign-out could not be confirmed. Your session may still be active. Try again.",
    }, { status: 503, headers });
  }
  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ signedOut: true }, { headers });
  }
  return new NextResponse(null, {
    status: 303,
    headers: { ...headers, Location: "/workspace" },
  });
}
