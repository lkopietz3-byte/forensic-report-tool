import { isAuthApiError, isAuthSessionMissingError } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The signed-in expert's saved reports, newest first. RLS scopes every row to
// the caller; an explicit owner filter and relation check also fail closed.
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  const unavailable = () => NextResponse.json({ error: "Could not refresh saved reports. Please try again.", code: "REPORT_LIST_UNAVAILABLE" }, { status: 503, headers });
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return unavailable();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError && !(isAuthSessionMissingError(authError) || (isAuthApiError(authError) && [401, 403].includes(authError.status)))) return unavailable();
    if (authError || !auth.user) return NextResponse.json({ error: "Please sign in to refresh your saved reports." }, { status: 401, headers });

    const { data, error } = await supabase
      .from("reports")
      .select("id, created_at, status, cases!inner(owner_id, matter, expert_role)")
      .eq("cases.owner_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !Array.isArray(data)) return unavailable();

    const reports = (data).map((r) => {
      const c = r.cases as unknown as { owner_id?: string; matter?: string; expert_role?: string } | { owner_id?: string; matter?: string; expert_role?: string }[];
      const caseObj = Array.isArray(c) ? c[0] : c;
      if (caseObj?.owner_id !== auth.user.id) throw new Error("Owner relation unavailable");
      return {
        id: r.id as string,
        createdAt: r.created_at as string,
        status: r.status as string,
        matter: caseObj?.matter || "Untitled matter",
      };
    });

    return NextResponse.json({ reports }, { headers });
  } catch {
    return unavailable();
  }
}
