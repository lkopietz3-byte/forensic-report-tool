import type { AuditEvent, EvidenceUnit } from "./types.js";
import type { AuditLog } from "./audit.js";
import { verifyAuditChain } from "./audit";
import { STRUCTURER_MODEL, modelDisplay } from "./modelDisplay";

// Re-exported so server-side exporters (docx/pdf) keep their existing import
// path. modelDisplay itself lives in a crypto-free module so client components
// can use it without pulling audit.ts into the browser bundle.
export { modelDisplay };

// AI-Disclosure Appendix. A structured projection of recorded model calls:
// model, version, evidence IDs logged as supplied, and output by section.
// It reflects the presented audit log; the log alone cannot establish that
// every relevant activity was captured. Motivated by 2026
// rulings (e.g. Conservation Law Foundation v. Shell, D. Conn. 2026) ordering
// experts to disclose AI prompts as Rule 26 "methodology". Whether any given
// disclosure satisfies a court's requirements remains a judicial determination.

export interface DisclosureSectionEntry {
  sectionKey: string;
  model: string;
  modelVersion: string;
  /** Evidence IDs recorded as supplied, resolved to human-readable sources. */
  evidenceSources: { id: string; location: string }[];
  timestamp: string;
}

export interface DisclosureAppendix {
  reportId: string;
  generatedAt: string;
  statement: string;
  models: string[];
  entries: DisclosureSectionEntry[];
  /** Full prompt/output records, included for full transparency on request. */
  rawEvents: AuditEvent[];
  /**
   * Consistency check over the presented audit chain. `verified` means the
   * entries as presented link and hash correctly; it does not establish
   * completeness, authorship, or whether the whole chain was rewritten.
   */
  integrity: { verified: boolean; note: string };
}

// Two honest statements. The AI version is used when any section was structured
// by a real model; the no-AI version when the report was assembled entirely by
// the rule-based formatter (e.g. keyless mode). Neither uses the term-of-art
// "closed-world" — it is spelled out in plain language so an expert never has to
// define jargon under oath.
const AI_STATEMENT = `This report was prepared with the assistance of an AI tool that organizes and formats the expert's own findings into the report structure. The drafting instructions restrict the model to the evidence the expert supplied, valid citation markers can identify only evidence IDs supplied for the report, and a missing or unknown marker is flagged. A valid marker records source linkage; it does not independently prove that the source is accurate or supports the sentence. The expert is responsible for reviewing, verifying, editing as needed, and adopting every fact and opinion before signing the report. The following record lists AI-assisted sections, the model and version recorded, and the evidence IDs recorded as supplied to it.`;

const NO_AI_STATEMENT = `This report was assembled in no-AI mode with a fixed, rule-based formatter; no generative model call appears in this report's assembly log. The formatter organizes expert-supplied material and citations for the expert's review. The expert is responsible for reviewing, verifying, editing as needed, and adopting every fact and opinion before signing the report. The following record lists the section assembly steps and evidence IDs recorded for them.`;

export function generateDisclosureAppendix(
  reportId: string,
  audit: AuditLog,
  evidence: EvidenceUnit[],
): DisclosureAppendix {
  const evidenceById = new Map(evidence.map((u) => [u.id, u]));
  const events = audit.forReport(reportId);

  const entries: DisclosureSectionEntry[] = events.map((e) => ({
    sectionKey: e.sectionKey,
    model: e.model,
    modelVersion: e.modelVersion,
    evidenceSources: e.inputIds.map((id) => ({
      id,
      location: evidenceById.get(id)?.location ?? "(source not found)",
    })),
    timestamp: e.createdAt,
  }));

  const models = [...new Set(events.map((e) => modelDisplay(e.model, e.modelVersion)))];

  // Classify the events that were recorded. An empty or incomplete log cannot
  // independently establish whether other activity occurred.
  const usedAI = events.some((e) => e.model !== STRUCTURER_MODEL);

  const chain = verifyAuditChain(events);
  const integrity = {
    verified: chain.ok,
    note: chain.ok
      ? "Each entry in this record is cryptographically linked to the entry before it, so a broken presented chain can be detected. The presented chain passed an internal consistency check; this does not prove completeness, authorship, or the absence of a full rewrite."
      : `The presented record failed its internal consistency check at entry ${chain.brokenAt}: ${chain.reason ?? "unknown reason"}. This check cannot determine the cause.`,
  };

  return {
    reportId,
    generatedAt: new Date().toISOString(),
    statement: usedAI ? AI_STATEMENT : NO_AI_STATEMENT,
    models,
    entries,
    rawEvents: events,
    integrity,
  };
}
