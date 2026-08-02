import type { ReportSectionKey } from "./types.js";
import type { Rule26Result } from "./rule26.js";
import type { OpinionReconstruction } from "./reconstruction.js";

// Report-readiness verdict — the composed pre-export check. This originates
// nothing: it is a pure aggregation of verifiers that already ran (Rule 26
// completeness + per-opinion reconstruction over the closed-world grounding and
// the tamper-evident audit chain) into a single blockers-vs-warnings view the
// UI and the export can show at a glance.
//
// It deliberately does NOT assert admissibility. It reports internal-consistency
// checks the tool can actually perform; whether a report is admissible is the
// court's determination. See docs/VOICE.md.

export type ReadinessSeverity = "blocker" | "warning";

export type ReadinessCode =
  // blockers — export should not proceed
  | "rule26_incomplete"
  | "closed_world_breach"
  | "invalid_citation"
  | "audit_chain_unverified"
  // warnings — structurally ready, but expert action needed before signing
  | "open_expert_item"
  | "ungrounded_sentence";

export interface ReadinessFinding {
  code: ReadinessCode;
  severity: ReadinessSeverity;
  /** The section the finding concerns, when section-specific. */
  sectionKey?: ReportSectionKey;
  /** How many instances this finding rolls up (e.g. ungrounded sentence count). */
  count: number;
  message: string;
}

export interface ReadinessVerdict {
  /** True iff there are zero blockers. Not a claim of admissibility. */
  ready: boolean;
  blockers: number;
  warnings: number;
  findings: ReadinessFinding[];
  /** One-line, honesty-safe summary suitable for UI and export. */
  headline: string;
}

const RULE26_REASON_TEXT: Record<string, string> = {
  missing: "is missing",
  empty: "is present but empty",
  unresolved_ungrounded: "has ungrounded sentence(s) awaiting expert review",
};

/**
 * Compose the Rule 26 completeness result and the per-opinion reconstructions
 * into one readiness verdict. Both inputs are already-computed projections; this
 * function adds no new facts and reads no evidence — it only classifies and
 * counts. Ordering of findings: blockers first (by appearance), then warnings.
 */
export function assessReadiness(
  rule26: Rule26Result,
  reconstructions: OpinionReconstruction[],
): ReadinessVerdict {
  const blockers: ReadinessFinding[] = [];
  const warnings: ReadinessFinding[] = [];

  // 1. Rule 26 completeness — every issue blocks export.
  for (const issue of rule26.issues) {
    blockers.push({
      code: "rule26_incomplete",
      severity: "blocker",
      sectionKey: issue.key,
      count: 1,
      message: `Rule 26 element "${issue.label}" ${
        RULE26_REASON_TEXT[issue.reason] ?? "is incomplete"
      }.`,
    });
  }

  // 2. Per-opinion integrity, derived from the closed-world reconstruction.
  let chainUnverified = false;
  for (const r of reconstructions) {
    if (!r.integrity.verified) chainUnverified = true;

    if (r.reliedOnButNeverFed.length > 0) {
      blockers.push({
        code: "closed_world_breach",
        severity: "blocker",
        sectionKey: r.sectionKey,
        count: r.reliedOnButNeverFed.length,
        message: `Section "${r.sectionKey}" cites evidence never provided to the tool (${r.reliedOnButNeverFed.join(
          ", ",
        )}). The closed-world contract forbids this — resolve before export.`,
      });
    }

    if (r.grounding.invalidCitationSentences.length > 0) {
      blockers.push({
        code: "invalid_citation",
        severity: "blocker",
        sectionKey: r.sectionKey,
        count: r.grounding.invalidCitationSentences.length,
        message: `Section "${r.sectionKey}" has ${r.grounding.invalidCitationSentences.length} sentence(s) citing an evidence id outside the supplied set.`,
      });
    }

    if (r.grounding.ungroundedSentences.length > 0) {
      warnings.push({
        code: "ungrounded_sentence",
        severity: "warning",
        sectionKey: r.sectionKey,
        count: r.grounding.ungroundedSentences.length,
        message: `Section "${r.sectionKey}" has ${r.grounding.ungroundedSentences.length} sentence(s) not tied to a source — review before signing.`,
      });
    }

    if (r.grounding.placeholderSentences.length > 0) {
      warnings.push({
        code: "open_expert_item",
        severity: "warning",
        sectionKey: r.sectionKey,
        count: r.grounding.placeholderSentences.length,
        message: `Section "${r.sectionKey}" has ${r.grounding.placeholderSentences.length} open item(s) requiring expert input.`,
      });
    }
  }

  // 3. Audit-chain integrity is report-wide — report it once if any opinion's
  //    backing chain failed to verify.
  if (chainUnverified) {
    blockers.unshift({
      code: "audit_chain_unverified",
      severity: "blocker",
      count: 1,
      message:
        "The audit chain backing this report did not verify — the disclosure record may have been altered since recording.",
    });
  }

  const findings = [...blockers, ...warnings];
  const headline =
    blockers.length > 0
      ? `${blockers.length} item${
          blockers.length === 1 ? "" : "s"
        } to resolve before you sign and serve.`
      : warnings.length > 0
        ? `Structurally complete — ${warnings.length} open item${
            warnings.length === 1 ? "" : "s"
          } require expert input before signing.`
        : "All automated checks clean. You remain the author; review and sign.";

  return {
    ready: blockers.length === 0,
    blockers: blockers.length,
    warnings: warnings.length,
    findings,
    headline,
  };
}
