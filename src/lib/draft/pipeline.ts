import { AuditLog } from "../domain/audit.js";
import { checkGrounding } from "../domain/grounding.js";
import type {
  DisciplineTemplate,
  EvidenceUnit,
  ExpertProfile,
  ReportSection,
} from "../domain/types.js";
import type { LLMClient } from "./llm.js";
import {
  DRAFTING_SYSTEM_PROMPT,
  buildEvidenceSectionUserPrompt,
  renderProfileSection,
} from "./prompts.js";

export interface DraftReportArgs {
  reportId: string;
  template: DisciplineTemplate;
  /** All evidence units available for this case. */
  evidence: EvidenceUnit[];
  /**
   * Optional mapping of section key -> evidence ids relevant to that section.
   * Feeding each section only its relevant units keeps the model grounded and
   * cheaper. If a section is omitted, it receives all evidence.
   */
  evidenceBySection?: Partial<Record<ReportSectionKeyLike, string[]>>;
  profile: ExpertProfile;
  llm: LLMClient;
  audit: AuditLog;
}

type ReportSectionKeyLike = ReportSection["key"];

export interface DraftReportResult {
  sections: ReportSection[];
  audit: AuditLog;
}

/**
 * Draft a full report section-by-section. Evidence-required sections go through
 * the LLM under the grounding contract and are recorded in the audit log;
 * profile sections are rendered deterministically (never model-fabricated).
 */
export async function draftReport(args: DraftReportArgs): Promise<DraftReportResult> {
  const evidenceById = new Map(args.evidence.map((u) => [u.id, u]));
  const sections: ReportSection[] = [];

  for (const tmpl of args.template.sections) {
    if (!tmpl.requiresEvidence) {
      const text = renderProfileSection(tmpl, args.profile);
      sections.push({
        key: tmpl.key,
        title: tmpl.title,
        draftText: text,
        citedEvidenceIds: [],
        ungroundedFlags: [],
      });
      continue;
    }

    const ids = args.evidenceBySection?.[tmpl.key] ?? args.evidence.map((u) => u.id);
    const units = ids
      .map((id) => evidenceById.get(id))
      .filter((u): u is EvidenceUnit => u !== undefined);

    const user = buildEvidenceSectionUserPrompt({ section: tmpl, units });
    const completion = await args.llm.complete({
      system: DRAFTING_SYSTEM_PROMPT,
      user,
    });

    // Record the audit event BEFORE post-processing so the disclosure appendix
    // reflects exactly what the model received and produced.
    args.audit.append({
      reportId: args.reportId,
      sectionKey: tmpl.key,
      prompt: `SYSTEM:\n${DRAFTING_SYSTEM_PROMPT}\n\nUSER:\n${user}`,
      model: completion.model,
      modelVersion: completion.modelVersion,
      inputIds: units.map((u) => u.id),
      output: completion.text,
    });

    const grounding = checkGrounding(completion.text, units.map((u) => u.id));

    sections.push({
      key: tmpl.key,
      title: tmpl.title,
      draftText: completion.text,
      citedEvidenceIds: grounding.citedEvidenceIds,
      // Both ungrounded and invalid-citation sentences require expert review.
      ungroundedFlags: [
        ...grounding.ungroundedSentences,
        ...grounding.invalidCitationSentences,
      ],
    });
  }

  return { sections, audit: args.audit };
}
