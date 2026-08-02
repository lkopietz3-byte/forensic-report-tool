// Loose-ends coverage check (private, ephemeral, NEVER persisted).
//
// A deterministic, closed-world second set of eyes: it inspects ONLY the
// relationships among the expert's own confirmed evidence and drafted sections
// and surfaces neutral QUESTIONS about gaps the expert may want to resolve. It
// originates nothing — no facts, numbers, opinions, citations, or theories (the
// CLAUDE.md invariant) — it can only ask about material the expert already
// supplied.
//
// CRITICAL DESIGN RULE (do not weaken): this is a private aid the expert
// controls. Its output must stay EPHEMERAL — never written to the AuditLog,
// never included in the report or its AI-Disclosure record, never persisted
// server-side. A retained record that "the tool warned you about a gap and you
// proceeded" would be discoverable as Rule-26 methodology and hand opposing
// counsel an impeachment. Hence this module deliberately takes no AuditLog and
// returns a plain value the caller renders and then drops. (See the research
// memo and DEFERRED.md for the legal basis: CLF v. Shell; Numatics v. Balluff.)

import type { DisciplineTemplate, EvidenceUnit, ReportSection } from "./types";

// Sections that merely INDEX inputs (lists of records/facts/exhibits) rather
// than analyze them. A record cited only here is "listed but not relied upon" —
// a neutral loose-end worth a question, not a defect.
export const INDEX_SECTION_KEYS: ReadonlySet<string> = new Set([
  "records_reviewed",
  "facts_or_data_considered",
  "exhibits",
]);

const PLACEHOLDER_RE = /\[Expert input needed:[^\]]*\]/i;

export type CoverageCategory =
  | "unused_evidence"
  | "listed_not_relied"
  | "open_input"
  | "uncited_section";

export interface CoverageItem {
  id: string;
  category: CoverageCategory;
  /** A NEUTRAL coverage question. Never a substantive suggestion. */
  question: string;
  evidenceIds?: string[];
  sectionKeys?: string[];
}

export interface CoverageReport {
  items: CoverageItem[];
  /** For a reassurance line: "checked N sections and M records". */
  sectionsChecked: number;
  evidenceChecked: number;
  /**
   * True when every confirmed record is relied on in an analysis section — the
   * relational checks found no loose ends (open-input items may still exist).
   */
  inputsAllRelied: boolean;
  /** True when nothing at all needs the expert's attention. */
  clear: boolean;
}

/**
 * Compute loose-ends for a (whole or partial) report. Pure and deterministic;
 * the same inputs always yield the same questions. Takes no audit log and
 * persists nothing.
 */
export function findLooseEnds(args: {
  sections: ReportSection[];
  evidence: EvidenceUnit[];
  template: DisciplineTemplate;
  /** Override which section keys count as index/list sections. */
  indexSectionKeys?: ReadonlySet<string>;
}): CoverageReport {
  const indexKeys = args.indexSectionKeys ?? INDEX_SECTION_KEYS;
  const requiresEvidence = new Set(
    args.template.sections.filter((s) => s.requiresEvidence).map((s) => s.key),
  );

  // Where is each evidence id cited: anywhere vs. in a substantive (non-index)
  // analysis section.
  const citedAnywhere = new Set<string>();
  const citedInSubstantive = new Set<string>();
  for (const s of args.sections) {
    const isIndex = indexKeys.has(s.key);
    for (const id of s.citedEvidenceIds) {
      citedAnywhere.add(id);
      if (!isIndex) citedInSubstantive.add(id);
    }
  }

  const items: CoverageItem[] = [];

  // 1) Relational: evidence the expert confirmed but no analysis section uses.
  let allRelied = true;
  for (const u of args.evidence) {
    if (!citedAnywhere.has(u.id)) {
      allRelied = false;
      items.push({
        id: `unused:${u.id}`,
        category: "unused_evidence",
        question: `You confirmed “${u.location}” as evidence, but no section cites it yet — include it, or set it aside?`,
        evidenceIds: [u.id],
      });
    } else if (!citedInSubstantive.has(u.id)) {
      allRelied = false;
      items.push({
        id: `listed:${u.id}`,
        category: "listed_not_relied",
        question: `“${u.location}” appears in your records list but isn’t relied on in any analysis section — is that intentional?`,
        evidenceIds: [u.id],
      });
    }
  }

  // 2) Drafted evidence-sections that still carry an open expert-input item.
  for (const s of args.sections) {
    if (PLACEHOLDER_RE.test(s.draftText)) {
      items.push({
        id: `open:${s.key}`,
        category: "open_input",
        question: `“${s.title}” has an open “[Expert input needed]” item — supply it before you finalize?`,
        sectionKeys: [s.key],
      });
    }
  }

  // 3) Evidence-based sections drafted with no citation at all (and no
  //    placeholder already flagging the gap).
  for (const s of args.sections) {
    if (
      requiresEvidence.has(s.key) &&
      !indexKeys.has(s.key) &&
      s.draftText.trim().length > 0 &&
      s.citedEvidenceIds.length === 0 &&
      !PLACEHOLDER_RE.test(s.draftText)
    ) {
      items.push({
        id: `uncited:${s.key}`,
        category: "uncited_section",
        question: `“${s.title}” is an evidence-based section but doesn’t cite any source yet — add the supporting evidence?`,
        sectionKeys: [s.key],
      });
    }
  }

  return {
    items,
    sectionsChecked: args.sections.length,
    evidenceChecked: args.evidence.length,
    inputsAllRelied: allRelied,
    clear: items.length === 0,
  };
}

// ─── Challenge-readiness checklist (mechanism #1) ────────────────────────────
// A curated, per-discipline set of NEUTRAL coverage questions keyed to Rule 26 /
// the methodology (RAPEL) / Daubert — "what opposing counsel will probe." Pure
// self-check: the expert confirms each. As a conservative, reliable aid, a
// question may carry distinctive `mentions` terms; if NONE appear anywhere in
// the report text, `detected` is false and the UI may gently surface it ("not
// detected — addressed?"). This never claims a gap exists and never supplies the
// answer — it only asks. Like the loose-ends check, it is private and ephemeral.

export interface ChecklistQuestion {
  q: string;
  /** true = a distinctive term was found; false = none found; null = no term check configured. */
  detected: boolean | null;
}

export interface ChecklistGroup {
  sectionKey: string;
  sectionTitle: string;
  questions: ChecklistQuestion[];
}

export interface CoverageChecklist {
  groups: ChecklistGroup[];
  total: number;
  /** Count of questions whose distinctive terms were not found in the report. */
  notDetected: number;
}

/**
 * Build the challenge-readiness checklist from a discipline template. If
 * `reportText` is supplied, run conservative presence checks for questions that
 * declare distinctive `mentions` terms. Pure and deterministic; persists nothing.
 */
export function buildCoverageChecklist(
  template: DisciplineTemplate,
  reportText?: string,
): CoverageChecklist {
  const hay = (reportText ?? "").toLowerCase();
  const canDetect = reportText != null;
  const groups: ChecklistGroup[] = [];
  let total = 0;
  let notDetected = 0;

  for (const s of template.sections) {
    if (!s.coveragePrompts || s.coveragePrompts.length === 0) continue;
    const questions: ChecklistQuestion[] = s.coveragePrompts.map((p) => {
      let detected: boolean | null = null;
      if (canDetect && p.mentions && p.mentions.length > 0) {
        detected = p.mentions.some((m) => hay.includes(m.toLowerCase()));
      }
      total += 1;
      if (detected === false) notDetected += 1;
      return { q: p.q, detected };
    });
    groups.push({ sectionKey: s.key, sectionTitle: s.title, questions });
  }

  return { groups, total, notDetected };
}
