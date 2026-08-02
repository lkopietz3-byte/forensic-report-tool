import { log, logError } from "@/lib/log/logger";
import { NextResponse } from "next/server";
import { assembleUserReport } from "@/lib/report/assemble";
import { parseReportInput } from "@/lib/report/schema";
import {
  toEvidenceRows,
  toSectionRows,
  toAuditRows,
  toProfileRow,
} from "@/lib/report/persistence";
import { getLiveClientOrNull } from "@/lib/draft/liveClient";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { getSubscriptionFor } from "@/lib/billing/subscription";
import { checkServerAccess } from "@/lib/billing/featureGates";
import { VOCREHAB_TEMPLATE } from "@/lib/domain/template";
import { createRateLimiter } from "@/lib/http/rateLimit";
import {
  clientIp,
  isSameOriginRequest,
  readBoundedJson,
} from "@/lib/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Persist the expert's report to THEIR account. Each save writes an immutable
// snapshot: a new report row + its own append-only audit chain (the chain is
// per-report, so re-saving never mutates a prior disclosure record). All writes
// go through the RLS-scoped user client, so Postgres — not this code — enforces
// that an expert can only ever write under their own owner_id.

const MAX_BODY_BYTES = 1_200_000; // headroom for an optional cover logo (PNG data URL) in style
const rateLimited = createRateLimiter({ limit: 20, windowMs: 60_000 });

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
  }
  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }
  const user = await getCurrentUser();

  // Auth gate. "save_report" is a free feature, so an authenticated user always
  // passes; this is the one server check that keeps anonymous writes out.
  const gate = checkServerAccess("save_report", {
    authenticated: Boolean(user),
    subscription: null,
  });
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Sign in to save reports to your account.", code: gate.code },
      { status: gate.status },
    );
  }
  // Narrow: gate.ok guarantees an authenticated user.
  const me = user!;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Saving isn't available in this environment." },
      { status: 503 },
    );
  }

  const body = await readBoundedJson(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;
  const parsed = parseReportInput(body.value);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const ids = parsed.data.evidence.map((u) => u.id);
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json({ error: "Duplicate evidence ids" }, { status: 400 });
  }
  const sectionKeys = parsed.data.sections.map((s) => s.key);
  if (new Set(sectionKeys).size !== sectionKeys.length) {
    return NextResponse.json({ error: "Duplicate section keys" }, { status: 400 });
  }

  // Tracks the case row we create so a mid-sequence failure can be rolled back
  // (deleting the case cascades to inputs/evidence/reports/sections/audit).
  // PostgREST can't wrap these inserts in one DB transaction, so this is the
  // compensating action that prevents orphaned, half-written reports.
  let createdCaseId: string | null = null;

  try {
    // Expert opted out of AI → assemble with the rule-based structurer (no model).
    const llm = parsed.data.noAi ? null : await getLiveClientOrNull();
    const report = await assembleUserReport(parsed.data, llm);

    // 1. Profile (one per user; keyed to auth uid).
    {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: me.id, ...toProfileRow(parsed.data.profile) });
      if (error) throw new Error(`profile: ${error.message}`);
    }

    // 2. Case.
    const { data: caseRow, error: caseErr } = await supabase
      .from("cases")
      .insert({
        owner_id: me.id,
        matter: report.meta.matter,
        retaining_counsel: report.meta.retainingCounsel,
        expert_role: report.meta.expertRole,
      })
      .select("id")
      .single();
    if (caseErr || !caseRow) throw new Error(`case: ${caseErr?.message ?? "no row"}`);
    const caseId = caseRow.id as string;
    createdCaseId = caseId;

    // 3. One synthetic input to anchor the expert-entered evidence units.
    const { data: inputRow, error: inputErr } = await supabase
      .from("inputs")
      .insert({ case_id: caseId, type: "note", extracted_text: null })
      .select("id")
      .single();
    if (inputErr || !inputRow) throw new Error(`input: ${inputErr?.message ?? "no row"}`);
    const inputId = inputRow.id as string;

    // 4. Evidence units (logical id + section assignment preserved).
    const evidenceRows = toEvidenceRows(parsed.data).map((r) => ({
      ...r,
      input_id: inputId,
    }));
    if (evidenceRows.length) {
      const { error } = await supabase.from("evidence_units").insert(evidenceRows);
      if (error) throw new Error(`evidence: ${error.message}`);
    }

    // 5. Report.
    const { data: reportRow, error: reportErr } = await supabase
      .from("reports")
      .insert({
        case_id: caseId,
        discipline: VOCREHAB_TEMPLATE.discipline,
        template_version: VOCREHAB_TEMPLATE.version,
        status: "draft",
        // Display-only formatting choices, restored on reopen. Not hashed.
        deliverable_style: parsed.data.style ?? null,
      })
      .select("id")
      .single();
    if (reportErr || !reportRow) throw new Error(`report: ${reportErr?.message ?? "no row"}`);
    const reportId = reportRow.id as string;

    // 6. Sections.
    const sectionRows = toSectionRows(report).map((r) => ({ ...r, report_id: reportId }));
    if (sectionRows.length) {
      const { error } = await supabase.from("report_sections").insert(sectionRows);
      if (error) throw new Error(`sections: ${error.message}`);
    }

    // 7. Audit chain (append-only; every hashed field persisted verbatim).
    const auditRows = toAuditRows(report).map((r) => ({ ...r, report_id: reportId }));
    if (auditRows.length) {
      const { error } = await supabase.from("audit_events").insert(auditRows);
      if (error) throw new Error(`audit: ${error.message}`);
    }

    return NextResponse.json({ reportId, caseId }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    logError("report.save_failed", err);
    // Roll back any partially-written report so no orphaned/half-valid record
    // survives. Deleting the case cascades to all child rows (see 0001 schema).
    if (createdCaseId) {
      const { error: cleanupErr } = await supabase.from("cases").delete().eq("id", createdCaseId);
      if (cleanupErr) {
        log.error("report.save_rollback_failed", { err: cleanupErr.message });
      }
    }
    return NextResponse.json({ error: "Could not save the report." }, { status: 500 });
  }
}
