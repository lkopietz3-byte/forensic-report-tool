import type { AuditEvent, EvidenceUnit } from "./types.js";
import type { AuditLog } from "./audit.js";
import { verifyAuditChain } from "./audit";
import { STRUCTURER_MODEL, modelDisplay } from "./modelDisplay";

// Re-exported so server-side exporters (docx/pdf) keep their existing import
// path. modelDisplay itself lives in a crypto-free module so client components
// can use it without pulling audit.ts into the browser bundle.
export { modelDisplay };

// AI-Disclosure Appendix (the moat). A structured record of exactly how AI was
// used to prepare the report: every model, version, the evidence it was given,
// and what it produced — section by section. Built only from the append-only
// audit log so it cannot drift from what actually happened. Motivated by 2026
// rulings (e.g. Conservation Law Foundation v. Shell, D. Conn. 2026) ordering
// experts to disclose AI prompts as Rule 26 "methodology". Whether any given
// disclosure satisfies a court's requirements remains a judicial determination.

export interface DisclosureSectionEntry {
  sectionKey: string;
  model: string;
  modelVersion: string;
  /** Evidence units (resolved to human-readable sources) fed to the model. */
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
   * Tamper-evidence check over the audit chain backing this appendix. `verified`
   * means the disclosed events are internally consistent and unaltered since
   * they were hashed — not a guarantee that no one with database write access
   * ever rewrote the whole chain.
   */
  integrity: { verified: boolean; note: string };
}

// Two honest statements. The AI version is used when any section was structured
// by a real model; the no-AI version when the report was assembled entirely by
// the rule-based formatter (e.g. keyless mode). Neither uses the term-of-art
// "closed-world" — it is spelled out in plain language so an expert never has to
// define jargon under oath.
const AI_STATEMENT = `This report was prepared with the assistance of an AI tool that organizes and formats the expert's own findings into the report structure. The drafting instructions restrict the model to the evidence the expert supplied, valid citation markers can identify only evidence IDs supplied for the report, and a missing or unknown marker is flagged. A valid marker records source linkage; it does not independently prove that the source is accurate or supports the sentence. The expert reviewed, verified, edited, and adopted all content of this report and is solely responsible for every fact and opinion stated herein. The following record discloses each AI-assisted section, the model and version used, and the evidence provided to it.`;

const NO_AI_STATEMENT = `This report was prepared with a software tool that organizes and formats the expert's own findings into the report structure. No generative AI model produced any text in this report: each section was assembled by a fixed, rule-based formatter that can use only the evidence the expert supplied — it re-emits the expert's own confirmed text with a citation to its source and originates nothing. The expert reviewed, verified, edited, and adopted all content of this report and is solely responsible for every fact and opinion stated herein. The following record discloses how each section was assembled and the evidence provided for it.`;

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

  // No generative model touched the report when every recorded event used the
  // rule-based structurer (e.g. keyless mode) — the statement must say so
  // rather than claim AI assistance that didn't happen.
  const usedAI = events.some((e) => e.model !== STRUCTURER_MODEL);

  const chain = verifyAuditChain(events);
  const integrity = {
    verified: chain.ok,
    note: chain.ok
      ? "Each entry in this record is cryptographically linked to the entry before it, so any later edit or deletion would be detectable. This record checked as unaltered since it was recorded."
      : `Record check failed at entry ${chain.brokenAt}: ${chain.reason ?? "unknown reason"}. This record may have been altered after it was made.`,
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
