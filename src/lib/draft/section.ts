import { AuditLog } from "../domain/audit";
import { checkGrounding, splitSentences, type GroundingResult } from "../domain/grounding";
import type { EvidenceUnit, TemplateSection } from "../domain/types.js";
import type { LLMClient } from "./llm.js";
import { DRAFTING_SYSTEM_PROMPT, buildEvidenceSectionUserPrompt } from "./prompts";

// Draft ONE evidence-grounded section from a confirmed evidence set. Mirrors the
// evidence path of draftReport (same system prompt, same audit-before-grounding
// ordering) but for the single section the intake flow drafts live. Two modes:
//
//   * "live"       — a model (Claude) structures the units into prose with
//                    [[E:id]] citations. Real AI; disclosed as such.
//   * "structured" — deterministic, no model: each confirmed unit becomes one
//                    sentence carrying its own citation. Used in keyless preview.
//                    This originates nothing — it is literally the expert's
//                    supplied text, re-emitted with its citation — so it is
//                    honest to ship, but it must be disclosed as NOT AI.

const STRUCTURER_MODEL = "deterministic-structurer";
const STRUCTURER_VERSION = "no-ai-v1";

export type DraftMode = "live" | "structured";

export interface DraftSectionResult {
  draftText: string;
  grounding: GroundingResult;
  mode: DraftMode;
  /** Model identifier recorded in the audit log (honest about no-AI mode). */
  model: string;
  modelVersion: string;
  /** Evidence ids fed into this draft (the closed-world input set). */
  fedEvidenceIds: string[];
}

export interface DraftSectionArgs {
  reportId: string;
  section: TemplateSection;
  units: EvidenceUnit[];
  /** null => deterministic structuring (no model call). */
  llm: LLMClient | null;
  audit: AuditLog;
}

/** The raw draft of one section: the model/deterministic call ONLY — no audit,
 *  no grounding. Split out so assembleUserReport can run these CONCURRENTLY and
 *  then append the audit chain in deterministic template order (the append-only
 *  hash chain is order-sensitive, so the model calls parallelize but the audit
 *  writes must not). */
export interface SectionDraft {
  draftText: string;
  model: string;
  modelVersion: string;
  mode: DraftMode;
  prompt: string;
  fedEvidenceIds: string[];
}

export async function completeSectionDraft(args: {
  section: TemplateSection;
  units: EvidenceUnit[];
  llm: LLMClient | null;
  /** A prior build's LIVE draft for this section, round-tripped by the client on
   *  export. When present (and live mode applies), we re-record it verbatim instead
   *  of paying for a second model call that would DIVERGE from the text the expert
   *  reviewed — so the export ships exactly what was on screen and the disclosure
   *  records the same output. The prompt + fed ids are re-derived deterministically
   *  from the same section + units, so the audit chain stays consistent with the
   *  original build. The deterministic (no-AI) path re-runs instead: it's free and
   *  bit-identical, so there is nothing to preserve. Grounding still runs on the
   *  ADOPTED text downstream, so a stale or crafted draft cannot bypass the gate. */
  precomputed?: { draftText: string; model: string; modelVersion: string };
}): Promise<SectionDraft> {
  const { section, units } = args;
  const fedEvidenceIds = units.map((u) => u.id);
  const user = buildEvidenceSectionUserPrompt({ section, units });

  if (args.llm) {
    const livePrompt = `SYSTEM:\n${DRAFTING_SYSTEM_PROMPT}\n\nUSER:\n${user}`;
    // Honor a round-tripped draft ONLY if it does not claim the no-AI structurer.
    // In live mode every section is model-drafted, and the honest client never
    // round-trips a structurer draft, so a precomputed `model` of STRUCTURER_MODEL
    // can only be a forged payload trying to stamp a FALSE "no generative AI"
    // disclosure over AI-authored text — reject it and re-draft for real, so the
    // recorded model reflects reality and the AI/no-AI determination can't be lied
    // into by the caller.
    if (args.precomputed && args.precomputed.model !== STRUCTURER_MODEL) {
      return {
        draftText: args.precomputed.draftText,
        model: args.precomputed.model,
        modelVersion: args.precomputed.modelVersion,
        mode: "live",
        prompt: livePrompt,
        fedEvidenceIds,
      };
    }
    const completion = await args.llm.complete({ system: DRAFTING_SYSTEM_PROMPT, user });
    return {
      draftText: completion.text,
      model: completion.model,
      modelVersion: completion.modelVersion,
      mode: "live",
      prompt: livePrompt,
      fedEvidenceIds,
    };
  }
  return {
    draftText: structureUnits(units),
    model: STRUCTURER_MODEL,
    modelVersion: STRUCTURER_VERSION,
    mode: "structured",
    // The deterministic transform itself is the "prompt" so the audit trail is
    // honest about exactly how the text was produced (no model).
    prompt: `DETERMINISTIC STRUCTURING (no model). Each confirmed evidence unit re-emitted as one sentence carrying its own [[E:id]] citation. Section: ${section.title}.`,
    fedEvidenceIds,
  };
}

export async function draftSection(args: DraftSectionArgs): Promise<DraftSectionResult> {
  const draft = await completeSectionDraft({
    section: args.section,
    units: args.units,
    llm: args.llm,
  });
  // Record BEFORE grounding post-processing, matching draftReport, so the
  // disclosure appendix reflects exactly what was fed and produced.
  args.audit.append({
    reportId: args.reportId,
    sectionKey: args.section.key,
    prompt: draft.prompt,
    model: draft.model,
    modelVersion: draft.modelVersion,
    inputIds: draft.fedEvidenceIds,
    output: draft.draftText,
  });
  const grounding = checkGrounding(draft.draftText, draft.fedEvidenceIds);
  return {
    draftText: draft.draftText,
    grounding,
    mode: draft.mode,
    model: draft.model,
    modelVersion: draft.modelVersion,
    fedEvidenceIds: draft.fedEvidenceIds,
  };
}

/**
 * Deterministic structuring: emit each unit's own content as one sentence with
 * its citation appended. Originates nothing; the words are the expert's supplied
 * evidence. Produces a fully grounded section every time.
 */
function structureUnits(units: EvidenceUnit[]): string {
  if (units.length === 0) {
    return "[Expert input needed: no evidence units were provided for this section.]";
  }
  return units
    .flatMap((u) => {
      // Cite EVERY sentence in the unit, not just the last. The expert's
      // confirmed evidence is often a multi-sentence record quote; with a single
      // trailing marker the interior sentences read as ungrounded and the tool's
      // own draft would fail its own export gate. The marker goes INSIDE each
      // sentence (before its terminal period) so the per-sentence grounding
      // check sees a valid cite. Originates nothing — the words are the
      // expert's. splitSentences is abbreviation-aware ("Dr." won't split).
      const normalized = u.content.replace(/\s+/g, " ").trim();
      return splitSentences(normalized)
        .map((s) => s.replace(/[.!?]+$/, "").trim())
        .filter(Boolean)
        .map((body) => `${body} [[E:${u.id}]].`);
    })
    .join(" ");
}
