import { log } from "@/lib/log/logger";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The signed-in expert's saved reports, newest first. RLS scopes every row to
// the caller; this route adds no filtering of its own beyond ordering.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ reports: [] }, { headers: { "Cache-Control": "no-store" } });
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ reports: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data, error } = await supabase
    .from("reports")
    .select("id, created_at, status, cases!inner(matter, expert_role)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    log.error("report.list_failed", { err: error.message });
    return NextResponse.json({ reports: [] }, { status: 500 });
  }

  const reports = (data ?? []).map((r) => {
    const c = r.cases as unknown as { matter?: string; expert_role?: string } | { matter?: string; expert_role?: string }[];
    const caseObj = Array.isArray(c) ? c[0] : c;
    return {
      id: r.id as string,
      createdAt: r.created_at as string,
      status: r.status as string,
      matter: caseObj?.matter || "Untitled matter",
    };
  });

  return NextResponse.json({ reports }, { headers: { "Cache-Control": "no-store" } });
}
