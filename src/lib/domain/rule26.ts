import type {
  DisciplineTemplate,
  ReportSection,
  ReportSectionKey,
} from "./types.js";

// Fed. R. Civ. P. 26(a)(2)(B): a written expert report must contain six
// elements. Export is blocked (or hard-warned) if any are missing or empty.

// The six elements of Fed. R. Civ. P. 26(a)(2)(B). Element (i) has two parts —
// the opinions and their basis/reasons — which the template captures as two
// sections; both are labeled "(i)" (the second as a continuation) so the display
// never implies a seventh element.
export const RULE_26_ELEMENTS: { key: ReportSectionKey; label: string }[] = [
  { key: "opinions", label: "(i) A complete statement of all opinions the witness will express" },
  { key: "basis_and_reasons", label: "(i, cont.) The basis and reasons for those opinions" },
  { key: "facts_or_data_considered", label: "(ii) The facts or data the witness considered" },
  { key: "exhibits", label: "(iii) Any exhibits used to summarize or support the opinions" },
  { key: "qualifications", label: "(iv) The witness's qualifications, including all publications from the previous 10 years" },
  { key: "prior_testimony", label: "(v) All other cases in which the witness testified as an expert (at trial or by deposition) in the previous 4 years" },
  { key: "compensation", label: "(vi) A statement of the compensation for the study and testimony" },
];

export interface Rule26Issue {
  key: ReportSectionKey;
  label: string;
  reason: "missing" | "empty" | "unresolved_ungrounded";
}

export interface Rule26Result {
  ok: boolean;
  issues: Rule26Issue[];
}

function effectiveText(section: ReportSection): string {
  return (section.finalText ?? section.draftText ?? "").trim();
}

/**
 * Validate a set of drafted sections against Rule 26 before export.
 * `requireGroundingResolved` (default true) also blocks export when any
 * evidence-required section still has ungrounded sentences awaiting expert
 * review — enforcing the "expert verifies before sign-off" rule.
 *
 * We trust `section.ungroundedFlags` rather than re-deriving grounding here: the
 * flags were computed closed-world at draft time against the exact evidence set
 * fed to that section, which this function does not receive. Re-deriving from
 * text alone could only catch ungrounded-by-absence, never the more dangerous
 * invalid-citation class, so it would weaken — not strengthen — the gate. Once
 * the expert sets `finalText` they have authored and adopted the section, which
 * by design resolves the draft-time flags.
 */
export function validateRule26(
  sections: ReportSection[],
  template: DisciplineTemplate,
  requireGroundingResolved = true,
): Rule26Result {
  const byKey = new Map(sections.map((s) => [s.key, s]));
  const issues: Rule26Issue[] = [];

  for (const element of RULE_26_ELEMENTS) {
    const section = byKey.get(element.key);
    if (!section) {
      issues.push({ key: element.key, label: element.label, reason: "missing" });
      continue;
    }
    if (effectiveText(section).length === 0) {
      issues.push({ key: element.key, label: element.label, reason: "empty" });
    }
  }

  if (requireGroundingResolved) {
    const evidenceRequired = new Set(
      template.sections.filter((s) => s.requiresEvidence).map((s) => s.key),
    );
    for (const section of sections) {
      if (
        evidenceRequired.has(section.key) &&
        section.finalText === undefined &&
        section.ungroundedFlags.length > 0
      ) {
        issues.push({
          key: section.key,
          label: `Section "${section.title}" has ${section.ungroundedFlags.length} ungrounded sentence(s) needing expert review`,
          reason: "unresolved_ungrounded",
        });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}
