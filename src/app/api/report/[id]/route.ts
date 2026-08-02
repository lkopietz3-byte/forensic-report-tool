import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import {
  auditRowsToEvents,
  profileRowToProfile,
  rowsToAssembleInput,
  type AuditRow,
  type EvidenceRow,
  type SectionRow,
  type ProfileRow,
} from "@/lib/report/persistence";
import { verifyAuditChain } from "@/lib/domain/audit";
import { isSameOriginRequest } from "@/lib/http/request";
import { logError } from "@/lib/log/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rehydrate a saved report into the builder's AssembleInput, and re-verify the
// persisted audit chain (recompute hashes over the stored events). RLS scopes
// every query to the owner, so a non-owner id simply returns nothing.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable." }, { status: 503 });

  // Report + its case (RLS ensures ownership).
  const { data: report, error: repErr } = await supabase
    .from("reports")
    .select("id, case_id, deliverable_style, cases!inner(owner_id, matter, retaining_counsel, expert_role)")
    .eq("id", id)
    .maybeSingle();
  if (repErr || !report) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const caseRaw = report.cases as unknown;
  const caseObj = (Array.isArray(caseRaw) ? caseRaw[0] : caseRaw) as {
    owner_id?: string;
    matter?: string;
    retaining_counsel?: string;
    expert_role?: string;
  };
  // Defense-in-depth: RLS already scopes this query to the owner, but re-check
  // ownership in app code so a dropped/misconfigured policy can never silently
  // become a cross-tenant read of privileged case material. 404 (not 403) so the
  // response doesn't even confirm the id exists.
  if (caseObj?.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const caseId = report.case_id as string;

  // The four reads below are independent — run them concurrently instead of
  // five sequential round-trips (the dominant latency of opening a report).
  const [evidenceRows, sectionRows, prof, audit] = await Promise.all([
    // Evidence: inputs of the case → their evidence units (two-step chain).
    (async (): Promise<EvidenceRow[]> => {
      const { data: inputs } = await supabase.from("inputs").select("id").eq("case_id", caseId);
      const inputIds = (inputs ?? []).map((i) => i.id as string);
      if (!inputIds.length) return [];
      const { data: ev } = await supabase
        .from("evidence_units")
        .select("ref_id, content, location, section_key")
        .in("input_id", inputIds);
      return (ev ?? []) as EvidenceRow[];
    })(),
    supabase
      .from("report_sections")
      .select("section_key, draft_text, final_text, cited_evidence_ids, ungrounded_flags")
      .eq("report_id", id)
      .then((r) => (r.data ?? []) as SectionRow[]),
    supabase
      .from("profiles")
      .select("full_name, credentials, publications_last_10yr, prior_testimony_last_4yr, compensation_statement")
      .eq("id", user.id)
      .maybeSingle()
      .then((r) => (r.data as ProfileRow | null) ?? null),
    supabase
      .from("audit_events")
      .select("seq, event_id, chain_report_id, section_key, prompt, model, model_version, input_ids, output, created_at_iso, prev_hash, entry_hash")
      .eq("report_id", id)
      .then((r) => r.data),
  ]);
  const profile = profileRowToProfile(prof);
  const events = auditRowsToEvents((audit ?? []) as AuditRow[]);
  // verifyAuditChain([]) is vacuously ok — but a real saved report always has
  // audit events, so treat an empty chain as NOT verified (it signals a
  // partially-written / orphaned record, never a legitimately disclosable one).
  const chain = verifyAuditChain(events);
  const integrity = { ...chain, ok: chain.ok && events.length > 0 };

  const input = rowsToAssembleInput({
    meta: {
      matter: caseObj?.matter ?? "",
      retainingCounsel: caseObj?.retaining_counsel ?? "",
      expertRole: caseObj?.expert_role ?? "",
    },
    profile,
    evidenceRows,
    sectionRows,
  });

  return NextResponse.json(
    {
      reportId: id,
      // Fold the persisted formatting choices back in so the builder can restore
      // them; null for reports saved before this column existed.
      input: { ...input, style: (report as { deliverable_style?: unknown }).deliverable_style ?? null },
      integrity: {
        verified: integrity.ok,
        brokenAt: integrity.brokenAt,
        events: events.length,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// Delete one saved report and its one-to-one case container. Every save creates
// a fresh case snapshot, so deleting the case removes the report, evidence,
// sections, and audit events together via FK cascades. RLS + the explicit owner
// check prevent cross-account deletion even if a policy is later weakened.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
  }
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable." }, { status: 503 });

  const { data: report } = await supabase
    .from("reports")
    .select("case_id, cases!inner(owner_id)")
    .eq("id", id)
    .maybeSingle();
  if (!report) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const rawCase = report.cases as unknown;
  const caseObj = (Array.isArray(rawCase) ? rawCase[0] : rawCase) as { owner_id?: string };
  if (caseObj?.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const { error } = await supabase
      .from("cases")
      .delete()
      .eq("id", report.case_id as string)
      .eq("owner_id", user.id);
    if (error) throw error;
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    logError("report.delete_failed", err, { userId: user.id, reportId: id });
    return NextResponse.json({ error: "Could not delete the report." }, { status: 500 });
  }
}
