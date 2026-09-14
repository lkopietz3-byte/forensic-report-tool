import { logError } from "@/lib/log/logger";
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
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { isAuthApiError, isAuthSessionMissingError } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { VOCREHAB_TEMPLATE } from "@/lib/domain/template";
import { createRateLimiter } from "@/lib/http/rateLimit";
import {
  clientIp,
  isSameOriginRequest,
  readBoundedJson,
} from "@/lib/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Persist a new owner-scoped snapshot in one database transaction. The report
// owns its profile copy and audit identity; shared profile defaults update atomically.
const savedIds = z.object({reportId:z.string().uuid(),caseId:z.string().uuid()});
const headers = { "Cache-Control": "no-store" };
const unavailable = () => NextResponse.json({
  error: "Saving could not be confirmed. It may have succeeded. Refresh your saved reports before saving again; another save creates a new snapshot.",
  code: "REPORT_SAVE_UNAVAILABLE",
}, {status:503,headers});

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
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return unavailable();
    const {data:auth,error:authError} = await supabase.auth.getUser();
    if (authError && !(isAuthSessionMissingError(authError) || (isAuthApiError(authError) && [401,403].includes(authError.status)))) return unavailable();
    if (authError || !auth.user) return NextResponse.json({error:"Sign in to save reports to your account."},{status:401,headers});

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

    const reportId = randomUUID();
    const llm = parsed.data.noAi ? null : await getLiveClientOrNull();
    const report = await assembleUserReport(parsed.data, llm, reportId);
    const {data,error} = await supabase.rpc("save_report_snapshot", {
      p_meta: report.meta,
      p_profile: toProfileRow(parsed.data.profile),
      p_evidence: toEvidenceRows(parsed.data),
      p_report: {id:reportId,discipline:VOCREHAB_TEMPLATE.discipline,template_version:VOCREHAB_TEMPLATE.version,deliverable_style:parsed.data.style ?? null},
      p_sections: toSectionRows(report),
      p_audit: toAuditRows(report),
    });
    const result = savedIds.safeParse(data);
    if (error || !result.success || result.data.reportId !== reportId) return unavailable();
    return NextResponse.json(result.data,{headers});
  } catch (error) {
    logError("report.save_failed",error);
    // A lost response may follow a committed transaction. Never compensate by
    // deleting data or encourage a blind retry that creates another snapshot.
    return unavailable();
  }
}
