import { logError } from "@/lib/log/logger";
import { exportReportDocx } from "@/lib/export/docx";
import { exportReportPdf, UnsupportedGlyphError } from "@/lib/export/pdf";
import { reportFilename } from "@/lib/export/filename";
import { normalizeStyle } from "@/lib/export/style";
import { assembleUserReport } from "@/lib/report/assemble";
import { parseReportInput } from "@/lib/report/schema";
import { getLiveClientOrNull } from "@/lib/draft/liveClient";
import { isLiveDraftingEnabled } from "@/lib/flags/featureFlags";
import { isBillingLive } from "@/lib/billing/stripe";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { getSubscriptionFor } from "@/lib/billing/subscription";
import { deriveTier } from "@/lib/billing/featureGates";
import { getCreditBalance, spendCredit, refundCredit } from "@/lib/billing/credits";
import { reportFingerprint } from "@/lib/billing/creditLedger";
import { createRateLimiter } from "@/lib/http/rateLimit";
import { clientIp, readBoundedJson } from "@/lib/http/request";

export const runtime = "nodejs";

// Render the expert's OWN assembled report to a real .docx/.pdf — the actual
// deliverable, not a sample. No "SAMPLE" notice: it comes out as a clean,
// confidential, UNSIGNED draft (blank signature line) for the expert to review
// and sign. Nothing is persisted.

const MAX_BODY_BYTES = 6_000_000; // headroom for a cover logo + image-evidence figures (PNG data URLs)
const rateLimited = createRateLimiter({ limit: 20, windowMs: 60_000 });

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return Response.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }
  const body = await readBoundedJson(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  const parsed = parseReportInput(body.value);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  const ids = parsed.data.evidence.map((u) => u.id);
  if (new Set(ids).size !== ids.length) {
    return Response.json({ error: "Duplicate evidence ids" }, { status: 400 });
  }
  const sectionKeys = parsed.data.sections.map((s) => s.key);
  if (new Set(sectionKeys).size !== sectionKeys.length) {
    return Response.json({ error: "Duplicate section keys" }, { status: 400 });
  }

  // Auth is tied to the MODEL boundary, not to billing. Live assembly can call a
  // paid model per section (any evidence section without a round-tripped draft
  // re-drafts), so an unauthenticated caller must never reach it — even before
  // billing is armed (live drafting ON + billing OFF is a real launch state).
  // Keyless preview (no live model) stays open: a deterministic, no-cost path.
  const billingLive = isBillingLive();
  const user = isLiveDraftingEnabled() || billingLive ? await getCurrentUser() : null;
  if (isLiveDraftingEnabled() && !user) {
    return Response.json(
      { error: "Sign in to export your report.", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  // Server-side entitlement check, only ENFORCED when billing is live
  // (NEXT_PUBLIC_FF_BILLING) — until Stripe exists, enforcing would lock free
  // users out of their own report. Pro subscribers export freely; everyone else
  // spends one report credit per export (the first credit is granted free). The
  // credit is reserved AFTER the grounding gate, just before render, and
  // refunded if the render fails — so a blocked/failed export never charges.
  let creditUserId: string | null = null;
  if (billingLive) {
    if (!user) {
      return Response.json(
        { error: "Sign in to export your report.", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }
    const sb = await createSupabaseServerClient();
    const subscription = sb ? await getSubscriptionFor(sb, user.id) : null;
    if (deriveTier(subscription) !== "pro") {
      creditUserId = user.id; // non-Pro: must spend a credit (reserved below)
    }
  }

  const format = new URL(request.url).searchParams.get("format") === "pdf" ? "pdf" : "docx";

  let creditSpent = false;
  let creditsRemaining: number | null = null;
  let exportFingerprint: string | null = null;
  try {
    // Expert opted out of AI → assemble with the rule-based structurer (no model).
    const llm = parsed.data.noAi ? null : await getLiveClientOrNull();
    const report = await assembleUserReport(parsed.data, llm);

    // HARD GROUNDING GATE (the existential invariant). Refuse to render a
    // deliverable when any evidence-backed section contains a sentence that is
    // ungrounded (a factual claim with no citation) or cites an id that was
    // never fed to it (a fabricated citation). Without this, stripCitationMarkers
    // would launder a ghost cite into clean, authoritative prose under the
    // expert's signature. Enforced server-side because the route is directly
    // callable. Rule-26 completeness and "[Expert input needed]" placeholders
    // are deliberately NOT blockers here — a draft may legitimately be exported
    // with sections still to finish; only fabrication/ungrounding is fatal.
    const blocked = report.sections.filter((s) =>
      s.isProfile
        // Profile sections cite no case evidence, so block ONLY on an injected or
        // hand-edited ghost citation (an [[E:id]] marker where none is allowed) —
        // never on their ordinary un-cited boilerplate prose.
        ? s.grounding.invalidCitationSentences.length > 0
        : !s.grounding.isClean,
    );
    if (blocked.length > 0) {
      return Response.json(
        {
          error:
            "Export blocked: some sentences aren't cited to your evidence. Resolve the flagged sentences in Build & preview, then export.",
          code: "GROUNDING_BLOCKED",
          sections: blocked.map((s) => ({
            title: s.title,
            ungrounded: s.isProfile ? [] : s.grounding.ungroundedSentences,
            invalidCitations: s.grounding.invalidCitationSentences,
          })),
        },
        { status: 422 },
      );
    }

    // Reserve a credit atomically (only after the report passed the grounding
    // gate, so a blocked export never charges). Pro users never reach here.
    // A credit covers a REPORT, not a download: the spend is keyed to a
    // fingerprint of the report CONTENT (format and style excluded), so Word
    // then PDF of the same report — or a re-download — debits exactly once.
    if (creditUserId) {
      exportFingerprint = reportFingerprint({
        meta: parsed.data.meta,
        profile: parsed.data.profile,
        evidence: parsed.data.evidence,
        sections: parsed.data.sections,
      });
      // Make sure the one free "first report" credit exists, then spend.
      await getCreditBalance(creditUserId);
      const spend = await spendCredit(creditUserId, exportFingerprint);
      if (spend === "insufficient") {
        return Response.json(
          {
            error: "You're out of report credits. Buy another report credit to export this version.",
            code: "NEEDS_CREDIT",
          },
          { status: 402 },
        );
      }
      if (spend === "unavailable") {
        // Billing is live (isBillingLive gated us in) yet the ledger is
        // unreachable — fail loudly instead of handing out a free export.
        return Response.json(
          { error: "Billing is temporarily unavailable. Please try again shortly." },
          { status: 503 },
        );
      }
      // Only a REAL debit is refundable if the render later fails. An idempotent
      // "already_paid" re-export (Word then PDF of the same report) debited
      // nothing this call, so refunding it would return a credit never spent.
      creditSpent = spend === "debited";
      // Current balance after the (idempotent) spend, surfaced to the client so
      // it can confirm the export and refresh the displayed balance.
      creditsRemaining = await getCreditBalance(creditUserId);
    }

    // Image evidence → numbered figures, rendered after the body. They are cited
    // by id in the text like any evidence (grounding is unchanged); this just
    // carries the pixels to the exporter, which renders a Figures section.
    const figures = parsed.data.evidence
      .filter((e) => e.imageData)
      .map((e, i) => ({ n: i + 1, label: e.location, imageData: e.imageData! }));
    const args = {
      meta: report.meta,
      sections: report.exportSections,
      disclosure: report.appendix,
      reconstructions: report.reconstructions,
      readiness: report.readiness,
      expert: { fullName: report.profile.fullName, credentials: report.profile.credentials },
      figures,
      // Deliverable formatting chosen by the expert (defaults preserve the
      // historical output exactly).
      style: normalizeStyle(parsed.data.style),
    };
    const buf = format === "pdf" ? await exportReportPdf(args) : await exportReportDocx(args);
    const isPdf = format === "pdf";
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": isPdf
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${reportFilename(report.meta.matter)}.${isPdf ? "pdf" : "docx"}"`,
        "Cache-Control": "no-store",
        ...(creditsRemaining !== null
          ? { "X-Report-Credits-Remaining": String(creditsRemaining) }
          : {}),
      },
    });
  } catch (err) {
    // The render failed after we reserved a credit — give it back, whatever the cause.
    if (creditSpent && creditUserId) await refundCredit(creditUserId, exportFingerprint ?? undefined);
    // Expected user error: the PDF font can't draw some characters in the
    // report. Tell the expert plainly and point them at the Word export rather
    // than returning a "try again" that can never succeed. No credit was kept.
    if (err instanceof UnsupportedGlyphError) {
      return Response.json(
        {
          error:
            `The PDF font can't display some characters in your report (${err.characters.slice(0, 8).join(" ")}). ` +
            "Export to Word instead — it uses your system fonts — or replace those characters in the text.",
          code: "UNSUPPORTED_GLYPH",
          characters: err.characters,
        },
        { status: 422 },
      );
    }
    logError("report.export_failed", err);
    return Response.json({ error: "Could not build the report. Please try again." }, { status: 500 });
  }
}
