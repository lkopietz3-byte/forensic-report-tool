import { isAuthApiError, isAuthSessionMissingError } from "@supabase/supabase-js";
import { z } from "zod";
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

const profileSnapshotSchema = z.object({
  full_name:z.string(),credentials:z.string(),compensation_statement:z.string(),
  publications_last_10yr:z.array(z.string()),prior_testimony_last_4yr:z.array(z.string()),
});

const REPORT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function loadUnavailable(
  error: unknown,
  context: { userId: string; reportId: string; dependency: string },
) {
  logError("report.load_failed", error, context);
  return NextResponse.json(
    {
      error: "Could not open that report. Please try again.",
      code: "REPORT_LOAD_UNAVAILABLE",
      retryable: true,
    },
    {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "2" },
    },
  );
}

// Rehydrate a saved report into the builder's AssembleInput, and re-verify the
// persisted audit chain (recompute hashes over the stored events). RLS scopes
// every query to the owner, so a non-owner id simply returns nothing.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!REPORT_ID_RE.test(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return loadUnavailable(error, {
      userId: user.id,
      reportId: id,
      dependency: "client",
    });
  }
  if (!supabase) {
    return loadUnavailable(new Error("Supabase client unavailable."), {
      userId: user.id,
      reportId: id,
      dependency: "client",
    });
  }

  try {
    // Report + its case (RLS ensures ownership). An ordinary Supabase query
    // failure is returned in `error`, not thrown, and must never be presented as
    // a genuine 404.
    const { data: report, error: repErr } = await supabase
      .from("reports")
      .select("id, case_id, deliverable_style, profile_snapshot, cases!inner(owner_id, matter, retaining_counsel, expert_role)")
      .eq("id", id)
      .maybeSingle();
    if (repErr) {
      return loadUnavailable(repErr, {
        userId: user.id,
        reportId: id,
        dependency: "reports",
      });
    }
    if (!report) {
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
    const savedProfile = (report as {profile_snapshot?:unknown}).profile_snapshot;
    const hasSavedProfile = savedProfile !== null && savedProfile !== undefined;
    const profileSnapshot = hasSavedProfile ? profileSnapshotSchema.parse(savedProfile) : null;

    // These four branches are independent. Preserve each `{ data, error }`
    // result so no dependency failure can be mistaken for a legitimate empty
    // profile, section set, evidence set, or audit chain.
    const [evidenceResult, sectionsResult, profileResult, auditResult] = await Promise.all([
      (async (): Promise<{ data: EvidenceRow[] | null; error: unknown; dependency: string }> => {
        const inputsResult = await supabase
          .from("inputs")
          .select("id")
          .eq("case_id", caseId);
        if (inputsResult.error) {
          return { data: null, error: inputsResult.error, dependency: "inputs" };
        }
        const inputIds = (inputsResult.data ?? []).map((input) => input.id as string);
        if (hasSavedProfile && inputIds.length !== 1) return {data:null,error:new Error("Snapshot input anchor missing"),dependency:"inputs"};
        if (!inputIds.length) return { data: [], error: null, dependency: "evidence_units" };

        const evidenceQuery = await supabase
          .from("evidence_units")
          .select("ref_id, content, location, section_key")
          .in("input_id", inputIds);
        return {
          data: evidenceQuery.error ? null : (evidenceQuery.data ?? []) as EvidenceRow[],
          error: evidenceQuery.error,
          dependency: "evidence_units",
        };
      })(),
      supabase
        .from("report_sections")
        .select("section_key, draft_text, final_text, cited_evidence_ids, ungrounded_flags")
        .eq("report_id", id),
      hasSavedProfile ? Promise.resolve({data:profileSnapshot,error:null}) : supabase
        .from("profiles")
        .select("full_name, credentials, publications_last_10yr, prior_testimony_last_4yr, compensation_statement")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("audit_events")
        .select("seq, event_id, chain_report_id, section_key, prompt, model, model_version, input_ids, output, created_at_iso, prev_hash, entry_hash")
        .eq("report_id", id)
        .order("seq", { ascending: true }),
    ]);

    const failed = [
      evidenceResult,
      { ...sectionsResult, dependency: "report_sections" },
      { ...profileResult, dependency: "profiles" },
      { ...auditResult, dependency: "audit_events" },
    ].find((result) => result.error);
    if (failed) {
      return loadUnavailable(failed.error, {
        userId: user.id,
        reportId: id,
        dependency: failed.dependency,
      });
    }

    const {data:stillPresent,error:recheckError} = await supabase.from("reports")
      .select("id, case_id, cases!inner(owner_id)").eq("id",id).maybeSingle();
    if (recheckError) return loadUnavailable(recheckError,{userId:user.id,reportId:id,dependency:"report_recheck"});
    const remainingCase = stillPresent?.cases;
    const remainingOwner = (Array.isArray(remainingCase) ? remainingCase[0] : remainingCase) as {owner_id?:string}|null;
    if (!stillPresent || stillPresent.case_id !== caseId || remainingOwner?.owner_id !== user.id) {
      return NextResponse.json({error:"Not found."},{status:404,headers:{"Cache-Control":"no-store"}});
    }
    if (hasSavedProfile && (!sectionsResult.data?.length)) {
      return loadUnavailable(new Error("Saved sections missing"),{userId:user.id,reportId:id,dependency:"snapshot_sections"});
    }

    const evidenceRows = (evidenceResult.data ?? []) as EvidenceRow[];
    const sectionRows = (sectionsResult.data ?? []) as SectionRow[];
    const profile = profileRowToProfile((profileResult.data as ProfileRow | null) ?? null);
    const events = auditRowsToEvents((auditResult.data ?? []) as AuditRow[]);
    // verifyAuditChain([]) is vacuously ok — but a real saved report always has
    // audit events, so treat an empty chain as NOT verified (it signals a
    // partially-written / orphaned record, never a legitimately disclosable one).
    const chain = verifyAuditChain(events);
    const reportBound = events.length > 0 && events.every(event => event.reportId === id);
    const integrity = { ...chain, ok: chain.ok && events.length > 0 && (!hasSavedProfile || reportBound) };

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
        profileSource: hasSavedProfile ? "saved_snapshot" : "legacy_current_profile",
        // Fold the persisted formatting choices back in so the builder can restore
        // them; null for reports saved before this column existed.
        input: { ...input, style: (report as { deliverable_style?: unknown }).deliverable_style ?? null },
        integrity: {
          verified: integrity.ok,
          reportBound,
          brokenAt: integrity.brokenAt,
          events: events.length,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return loadUnavailable(error, {
      userId: user.id,
      reportId: id,
      dependency: "query_exception",
    });
  }
}

// Delete the requested snapshot only through the atomic, owner-scoped RPC.
// It refuses a shared case rather than cascading into other saved reports.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = { "Cache-Control": "no-store" };
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-site request refused." }, { status: 403, headers });
  }
  const { id } = await params;
  if (!REPORT_ID_RE.test(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404, headers });
  }
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("Auth unavailable");
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      if (isAuthSessionMissingError(authError) ||
          (isAuthApiError(authError) && [401, 403].includes(authError.status))) {
        return NextResponse.json({ error: "Not signed in." }, { status: 401, headers });
      }
      throw authError;
    }
    if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401, headers });

    const { data, error } = await supabase.rpc("delete_saved_report", { p_report_id: id });
    if (error) throw error;
    if (data === "deleted") return new Response(null, { status: 204, headers });
    if (data === "not_found") {
      return NextResponse.json({ error: "Not found." }, { status: 404, headers });
    }
    if (data === "shared_case") {
      return NextResponse.json({
        code: "REPORT_DELETE_SHARED_CASE",
        error: "Nothing was deleted. This report shares its case with another saved report, so it cannot be deleted separately here.",
      }, { status: 409, headers });
    }
    throw new Error("Invalid delete result");
  } catch {
    // A transport failure may arrive after a transaction committed: report
    // uncertainty rather than promising either deletion or preservation.
    return NextResponse.json({
      code: "REPORT_DELETE_UNAVAILABLE",
      error: "Deletion could not be confirmed. Refresh your saved reports before trying again.",
    }, { status: 503, headers });
  }
}
