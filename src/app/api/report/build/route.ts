import { logError } from "@/lib/log/logger";
import { NextResponse } from "next/server";
import { assembleUserReport } from "@/lib/report/assemble";
import { parseReportInput } from "@/lib/report/schema";
import { getLiveClientOrNull } from "@/lib/draft/liveClient";
import { isLiveDraftingEnabled } from "@/lib/flags/featureFlags";
import { getCurrentUser } from "@/lib/auth/user";
import { createRateLimiter, aiCircuitBreaker } from "@/lib/http/rateLimit";
import { clientIp, readBoundedJson } from "@/lib/http/request";

export const runtime = "nodejs";

// Assemble the expert's report and return it as JSON for on-screen preview/edit
// (grounding status per section, the live Rule-26 + readiness check, and the
// disclosure record). The file deliverable comes from /api/report/export.
// Nothing is persisted.

const MAX_BODY_BYTES = 6_000_000; // headroom for a cover logo + image-evidence figures (PNG data URLs)
const rateLimited = createRateLimiter({ limit: 30, windowMs: 60_000 });

export async function POST(request: Request) {
  // Live assembly can call a paid model per section, so require a signed-in user
  // — an unauthenticated caller must not be able to burn API tokens. Keyless
  // preview (no live model) is a deterministic, no-cost path, so it stays open.
  if (isLiveDraftingEnabled() && !(await getCurrentUser())) {
    return NextResponse.json({ error: "Sign in to build a live report." }, { status: 401 });
  }
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }
  if (aiCircuitBreaker("ai")) {
    return NextResponse.json({ error: "The service is busy right now. Please try again in a moment." }, { status: 429 });
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
  // Reject duplicate section keys: assembly maps by key (last-wins), so a dup
  // would silently discard the first entry's text. Surface it instead.
  const sectionKeys = parsed.data.sections.map((s) => s.key);
  if (new Set(sectionKeys).size !== sectionKeys.length) {
    return NextResponse.json({ error: "Duplicate section keys" }, { status: 400 });
  }

  try {
    // Expert opted out of AI → assemble with the rule-based structurer (no model).
    const llm = parsed.data.noAi ? null : await getLiveClientOrNull();
    const r = await assembleUserReport(parsed.data, llm);
    return NextResponse.json(
      {
        meta: r.meta,
        sections: r.sections.map((s) => ({
          key: s.key,
          title: s.title,
          text: s.text,
          isProfile: s.isProfile,
          grounding: {
            isClean: s.grounding.isClean,
            ungrounded: s.grounding.ungroundedSentences.length,
            placeholders: s.grounding.placeholderSentences.length,
            citedEvidenceIds: s.grounding.citedEvidenceIds,
            // The actual flagged sentences, so the expert can see exactly which
            // lines need a citation rather than just a count.
            ungroundedSentences: s.grounding.ungroundedSentences,
            invalidCitationSentences: s.grounding.invalidCitationSentences,
          },
        })),
        disclosure: {
          statement: r.appendix.statement,
          models: r.appendix.models,
          integrity: r.appendix.integrity,
          generatedAt: r.appendix.generatedAt,
          entries: r.appendix.entries.map((e) => ({
            sectionKey: e.sectionKey,
            model: e.model,
            modelVersion: e.modelVersion,
            evidenceSources: e.evidenceSources,
          })),
          // The full hash-chained audit events, so the client can offer a
          // downloadable disclosure manifest that anyone can independently
          // verify at /verify (see src/lib/domain/verifyManifest.ts). This is
          // the expert's own report data, returned to the expert's own browser.
          rawEvents: r.appendix.rawEvents,
        },
        rule26: { ok: r.rule26.ok, issues: r.rule26.issues },
        readiness: {
          ready: r.readiness.ready,
          headline: r.readiness.headline,
          blockers: r.readiness.blockers,
          warnings: r.readiness.warnings,
          findings: r.readiness.findings.map((f) => ({
            severity: f.severity,
            message: f.message,
          })),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    logError("report.build_failed", err);
    return NextResponse.json({ error: "Could not build the report. Please try again." }, { status: 500 });
  }
}
