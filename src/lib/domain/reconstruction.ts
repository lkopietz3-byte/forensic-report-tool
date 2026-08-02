import type { AuditEvent, EvidenceUnit, ReportSection, ReportSectionKey } from "./types.js";
import type { AuditLog } from "./audit.js";
import { verifyAuditChain } from "./audit";
import { checkGrounding, extractAllCitedIds } from "./grounding";

// Data->opinion reconstruction (the moat's headline capability). When an opinion
// is challenged in deposition or on a Daubert motion, the expert must be able to
// show, for that exact opinion: which model produced the draft, under what
// prompt, from which supplied evidence — and crucially, which evidence the
// ADOPTED (signed) text actually relies on, distinct from everything that was
// merely fed to the model. Mandated by RELEASE.md's end-to-end smoke and the
// 2026 AI-disclosure rulings. This is a pure projection of the append-only audit
// chain plus the expert's adopted section text; it originates nothing.

export interface ModelCallRecord {
  model: string;
  modelVersion: string;
  prompt: string;
  timestamp: string;
  /** Evidence-unit ids fed into this specific model call (closed-world input). */
  evidenceFedIds: string[];
}

export interface OpinionReconstruction {
  reportId: string;
  sectionKey: ReportSectionKey;
  /** Whether an AI model was used for this section at all. Profile-rendered
   *  sections (qualifications, compensation) are deterministic and have none. */
  aiAssisted: boolean;
  /** Which text's provenance was reconstructed: the signed final or the draft. */
  adoptedTextSource: "final" | "draft";
  /** Every model call that produced this section, chronological. */
  modelCalls: ModelCallRecord[];
  /** Evidence the ADOPTED text actually cites AND that was fed to the model. */
  reliedOn: { id: string; location: string }[];
  /** Fed to the model but not cited in the adopted text (considered, not relied on). */
  fedButNotReliedOn: { id: string; location: string }[];
  /**
   * Ids cited in the adopted text that were NEVER fed to any model call for this
   * section. Under the closed-world contract this MUST be empty; a non-empty
   * list is an integrity alarm — the signed opinion cites something the tool was
   * never given, which is exactly the fabrication failure mode we guard against.
   */
  reliedOnButNeverFed: string[];
  /** Grounding status of the adopted text against the closed-world fed set. */
  grounding: {
    isClean: boolean;
    ungroundedSentences: string[];
    invalidCitationSentences: string[];
    placeholderSentences: string[];
  };
  /**
   * Tamper-evidence over the FULL report chain (a single section's events are a
   * subset, not an independent chain, so they are verified in the context of the
   * whole report). `verified` means the disclosed events are unaltered since
   * recording — tamper-evident, not tamper-proof.
   */
  integrity: { verified: boolean; note: string };
}

function resolveLocations(
  ids: string[],
  evidenceById: Map<string, EvidenceUnit>,
): { id: string; location: string }[] {
  return ids.map((id) => ({
    id,
    location: evidenceById.get(id)?.location ?? "(source not found)",
  }));
}

/**
 * Reconstruct the provenance of one section's opinion. `sections` is the set of
 * adopted report sections (final or in-progress); `audit` and `evidence` are the
 * append-only log and the supplied evidence units. Throws if the section is not
 * present — a challenged opinion must exist to be defended.
 */
export function reconstructOpinion(
  reportId: string,
  sectionKey: ReportSectionKey,
  sections: ReportSection[],
  audit: AuditLog,
  evidence: EvidenceUnit[],
): OpinionReconstruction {
  const section = sections.find((s) => s.key === sectionKey);
  if (!section) {
    throw new Error(`Cannot reconstruct opinion: section "${sectionKey}" not found in report.`);
  }

  const evidenceById = new Map(evidence.map((u) => [u.id, u]));
  const reportEvents = audit.forReport(reportId);
  const sectionEvents = reportEvents.filter((e) => e.sectionKey === sectionKey);

  const modelCalls: ModelCallRecord[] = sectionEvents.map((e: AuditEvent) => ({
    model: e.model,
    modelVersion: e.modelVersion,
    prompt: e.prompt,
    timestamp: e.createdAt,
    evidenceFedIds: [...e.inputIds],
  }));

  // Closed-world set for THIS section = union of everything fed across its calls.
  const fedSet = new Set<string>();
  for (const e of sectionEvents) for (const id of e.inputIds) fedSet.add(id);

  // The text the expert adopted; final outranks draft.
  const adoptedText = section.finalText ?? section.draftText;
  const adoptedTextSource: "final" | "draft" =
    section.finalText !== undefined ? "final" : "draft";

  // Integrity is always over the full report chain (subset would mis-link).
  const chain = verifyAuditChain(reportEvents);
  const integrity = {
    verified: chain.ok,
    note: chain.ok
      ? "The audit chain backing this opinion verified as internally consistent and unaltered since recording."
      : `Audit chain verification failed at event ${chain.brokenAt}: ${chain.reason ?? "unknown reason"}. This reconstruction may have been altered after recording.`,
  };

  // A section with no model calls was rendered deterministically (e.g. from the
  // expert profile). It involved no AI, so grounding-against-evidence does not
  // apply and would mis-flag every plain sentence as ungrounded.
  if (sectionEvents.length === 0) {
    return {
      reportId,
      sectionKey,
      aiAssisted: false,
      adoptedTextSource,
      modelCalls: [],
      reliedOn: [],
      fedButNotReliedOn: [],
      reliedOnButNeverFed: [],
      grounding: {
        isClean: true,
        ungroundedSentences: [],
        invalidCitationSentences: [],
        placeholderSentences: [],
      },
      integrity,
    };
  }

  const allCited = extractAllCitedIds(adoptedText);
  const reliedOnIds = allCited.filter((id) => fedSet.has(id));
  const reliedOnButNeverFed = allCited.filter((id) => !fedSet.has(id));
  const fedButNotReliedOnIds = [...fedSet].filter((id) => !allCited.includes(id));

  const g = checkGrounding(adoptedText, [...fedSet]);

  return {
    reportId,
    sectionKey,
    aiAssisted: true,
    adoptedTextSource,
    modelCalls,
    reliedOn: resolveLocations(reliedOnIds, evidenceById),
    fedButNotReliedOn: resolveLocations(fedButNotReliedOnIds, evidenceById),
    reliedOnButNeverFed,
    grounding: {
      isClean: g.isClean,
      ungroundedSentences: g.ungroundedSentences,
      invalidCitationSentences: g.invalidCitationSentences,
      placeholderSentences: g.placeholderSentences,
    },
    integrity,
  };
}

/** Reconstruct every section present in the report, in the order supplied. */
export function reconstructAllOpinions(
  reportId: string,
  sections: ReportSection[],
  audit: AuditLog,
  evidence: EvidenceUnit[],
): OpinionReconstruction[] {
  return sections.map((s) =>
    reconstructOpinion(reportId, s.key, sections, audit, evidence),
  );
}
