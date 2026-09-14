import { AuditLog } from "../domain/audit";
import { checkGrounding, type GroundingResult } from "../domain/grounding";
import { generateDisclosureAppendix, type DisclosureAppendix } from "../domain/disclosure";
import {
  reconstructAllOpinions,
  type OpinionReconstruction,
} from "../domain/reconstruction";
import { assessReadiness, type ReadinessVerdict } from "../domain/readiness";
import { validateRule26, type Rule26Result } from "../domain/rule26";
import { VOCREHAB_TEMPLATE } from "../domain/template";
import type {
  EvidenceUnit,
  ExpertProfile,
  ReportMeta,
  ReportSection,
} from "../domain/types";
import { completeSectionDraft, type SectionDraft } from "../draft/section";
import type { LLMClient } from "../draft/llm";

// Assemble a REAL report from the expert's OWN inputs — the same pipeline the
// sample uses (draft → audit → grounding → disclosure → rule26 → readiness), but
// parameterized on user data instead of fixtures. This is what turns the
// one-section demo into an end-to-end product: the expert tags their evidence to
// sections, and this builds a complete, grounded, disclosable report they can
// export. Nothing is persisted; the audit chain lives only for this request.
//
// Honesty invariant holds throughout: every evidence section is drafted ONLY from
// the units the expert assigned to it (closed-world), grounding is enforced, and
// the disclosure appendix is a pure projection of the audit log this build wrote.

const REPORT_ID = "user-report";

export interface AssembleInput {
  meta: { matter: string; retainingCounsel: string; expertRole: string };
  profile: ExpertProfile;
  /** The expert's confirmed evidence units (inputId is not required from callers). */
  evidence: { id: string; content: string; location: string }[];
  /** One entry per section the expert chose to include, in any order.
   *  `draftText`/`draftModel`/`draftModelVersion` carry a prior build's LIVE draft
   *  so export can re-record it instead of re-drafting (see completeSectionDraft's
   *  `precomputed`); omitted on the first build, present on export. */
  sections: {
    key: string;
    evidenceIds: string[];
    finalText?: string;
    draftText?: string;
    draftModel?: string;
    draftModelVersion?: string;
  }[];
}

export interface AssembledSection {
  key: string;
  title: string;
  /** What to show on screen: the expert's edit if present, else the draft. */
  text: string;
  grounding: GroundingResult;
  /** True for profile sections (qualifications/compensation) — no AI, no evidence. */
  isProfile: boolean;
}

export interface AssembledReport {
  meta: ReportMeta;
  profile: ExpertProfile;
  evidence: EvidenceUnit[];
  sections: AssembledSection[];
  appendix: DisclosureAppendix;
  reconstructions: OpinionReconstruction[];
  rule26: Rule26Result;
  readiness: ReadinessVerdict;
  /** Shaped for the DOCX/PDF exporters. */
  exportSections: ReportSection[];
}

/** Profile (non-evidence) section text, built from the expert's own profile. */
function profileText(key: string, p: ExpertProfile): string {
  if (key === "qualifications") {
    const head = [p.fullName, p.credentials].filter(Boolean).join(". ");
    const pubs = p.publicationsLast10yr?.filter(Boolean) ?? [];
    return pubs.length
      ? `${head}.\nPublications (last 10 years):\n${pubs.join("\n")}`
      : `${head}.`;
  }
  if (key === "prior_testimony") {
    const cases = p.priorTestimonyLast4yr?.filter(Boolean) ?? [];
    return cases.length ? cases.join("\n") : "None in the previous 4 years.";
  }
  if (key === "compensation") {
    return p.compensationStatement || "[Expert input needed: statement of compensation.]";
  }
  return "";
}

// How many section drafts (live model calls) to run at once. A full report is
// ~25 sections; serial calls blow the serverless time budget, so fan them out.
const DRAFT_CONCURRENCY = 6;

/** Run `fn` over `items` with at most `limit` promises in flight at once. */
async function mapWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      await fn(items[next++]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

export async function assembleUserReport(
  input: AssembleInput,
  llm: LLMClient | null = null,
  reportId: string = REPORT_ID,
): Promise<AssembledReport> {
  const audit = new AuditLog();
  // The pipeline keys on id/content/location; inputId is bookkeeping only.
  const evidence: EvidenceUnit[] = input.evidence.map((u) => ({
    id: u.id,
    inputId: "user",
    content: u.content,
    location: u.location,
  }));
  const evidenceById = new Map(evidence.map((u) => [u.id, u]));
  const chosen = new Map(input.sections.map((s) => [s.key, s]));

  const sections: AssembledSection[] = [];
  const exportSections: ReportSection[] = [];

  // Phase 1 — draft every chosen EVIDENCE section, running the model calls
  // CONCURRENTLY (bounded). ~25 serial calls would blow the serverless time
  // budget; the append-only audit chain is written separately in phase 2, so
  // parallelism here cannot scramble its deterministic order.
  const evidenceSections = VOCREHAB_TEMPLATE.sections.filter(
    (s) => chosen.has(s.key) && s.requiresEvidence,
  );
  const drafts = new Map<string, SectionDraft>();
  await mapWithConcurrency(evidenceSections, DRAFT_CONCURRENCY, async (section) => {
    const sel = chosen.get(section.key)!;
    const units = sel.evidenceIds
      .map((id) => evidenceById.get(id))
      .filter((u): u is EvidenceUnit => Boolean(u));
    // If the client round-tripped this section's prior live draft, re-record it
    // rather than re-drafting (no second paid call, no divergence from what the
    // expert reviewed). Requires all three provenance fields; grounding still runs
    // on the adopted text below, so a mismatched draft cannot slip the gate.
    const precomputed =
      sel.draftText != null && sel.draftModel != null && sel.draftModelVersion != null
        ? {
            draftText: sel.draftText,
            model: sel.draftModel,
            modelVersion: sel.draftModelVersion,
          }
        : undefined;
    drafts.set(section.key, await completeSectionDraft({ section, units, llm, precomputed }));
  });

  // Phase 2 — assemble in the template's canonical order, appending the
  // append-only audit chain deterministically as we go.
  for (const section of VOCREHAB_TEMPLATE.sections) {
    const sel = chosen.get(section.key);
    if (!sel) continue;
    const edited = sel.finalText?.trim() || undefined;

    if (section.requiresEvidence) {
      const draft = drafts.get(section.key)!;
      // Record BEFORE grounding post-processing, matching draftSection, so the
      // disclosure appendix reflects exactly what was fed and produced.
      audit.append({
        reportId: reportId,
        sectionKey: section.key,
        prompt: draft.prompt,
        model: draft.model,
        modelVersion: draft.modelVersion,
        inputIds: draft.fedEvidenceIds,
        output: draft.draftText,
      });
      // Ground the ADOPTED text (the expert's edit if present, else the draft) —
      // that is what actually gets exported. Without this, an injected finalText
      // citing an unfed id would be checked against the draft and slip the gate.
      const adopted = edited ?? draft.draftText;
      const grounding = checkGrounding(adopted, draft.fedEvidenceIds);
      exportSections.push({
        key: section.key,
        title: section.title,
        draftText: draft.draftText,
        finalText: edited,
        citedEvidenceIds: grounding.citedEvidenceIds,
        ungroundedFlags: grounding.ungroundedSentences,
      });
      sections.push({
        key: section.key,
        title: section.title,
        text: adopted,
        grounding,
        isProfile: false,
      });
    } else {
      const text = edited ?? profileText(section.key, input.profile);
      // Profile sections (qualifications / compensation / prior testimony) are
      // the expert's own boilerplate and cite NO case evidence. Ground them
      // against an EMPTY allowed set so any [[E:id]] marker — a hand-edited or
      // injected ghost cite — surfaces as an INVALID citation the export gate can
      // refuse, instead of being silently stripped and shipped as fabricated
      // prose under signature. Their ordinary un-cited prose is expected and
      // never blocks (the gate ignores a profile's ungrounded sentences).
      const grounding = checkGrounding(text, []);
      exportSections.push({
        key: section.key,
        title: section.title,
        draftText: text,
        citedEvidenceIds: [],
        ungroundedFlags: [],
      });
      sections.push({
        key: section.key,
        title: section.title,
        text,
        grounding,
        isProfile: true,
      });
    }
  }

  const appendix = generateDisclosureAppendix(reportId, audit, evidence);
  const reconstructions = reconstructAllOpinions(reportId, exportSections, audit, evidence);
  const rule26 = validateRule26(exportSections, VOCREHAB_TEMPLATE);
  const readiness = assessReadiness(rule26, reconstructions);

  const meta: ReportMeta = {
    id: reportId,
    caseId: "user-case",
    discipline: VOCREHAB_TEMPLATE.discipline,
    templateVersion: VOCREHAB_TEMPLATE.version,
    matter: input.meta.matter,
    retainingCounsel: input.meta.retainingCounsel,
    expertRole: input.meta.expertRole,
  };

  return {
    meta,
    profile: input.profile,
    evidence,
    sections,
    appendix,
    reconstructions,
    rule26,
    readiness,
    exportSections,
  };
}
