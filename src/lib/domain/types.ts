// Core domain types. Framework-agnostic and dependency-free so they can be
// unit-tested without Next/Supabase/Anthropic present.

export type InputType =
  | "note"
  | "photo"
  | "deposition"
  | "police_report"
  | "calc"
  | "measurement"
  | "doc"
  | "engagement_letter";

/** A raw item the expert supplied for a case. */
export interface CaseInput {
  id: string;
  caseId: string;
  type: InputType;
  /** Where the original file lives (storage URL); optional for plain notes. */
  rawFileUrl?: string;
  /** Extracted/transcribed text from the input, if any. */
  extractedText?: string;
}

/**
 * A citable atom extracted from a CaseInput. The drafting pipeline is only ever
 * allowed to ground report text in evidence units — never in model "knowledge".
 */
export interface EvidenceUnit {
  id: string;
  inputId: string;
  /** The actual content the model may use. */
  content: string;
  /** Human-readable source locator, e.g. "Depo p.42 ln.10" or "Scene photo 7". */
  location: string;
}

export type ReportSectionKey =
  // Rule 26(a)(2)(B) required elements
  | "opinions"
  | "basis_and_reasons"
  | "facts_or_data_considered"
  | "exhibits"
  | "qualifications"
  | "prior_testimony"
  | "compensation"
  // Common narrative sections (discipline templates add/override)
  | "background"
  | "scope_of_assignment"
  | "summary_of_opinions"
  | "investigation"
  | "analysis"
  // Forensic vocational-rehabilitation (RAPEL) narrative sections
  | "records_reviewed"
  | "interview"
  | "vocational_testing"
  | "functional_capacity"
  | "transferable_skills"
  | "labor_market_survey"
  | "rehabilitation_plan"
  | "earning_capacity"
  | "labor_force_participation"
  | "loss_of_earning_capacity";

/**
 * A neutral coverage QUESTION for the private challenge-readiness checklist. It
 * names a methodology/Rule-26/Daubert element the expert should confirm is
 * addressed — it never supplies the substantive answer. `mentions`, if given, is
 * a set of distinctive terms; when NONE appear anywhere in the report, the UI may
 * gently flag the question as "not detected" (still a question, never a claim).
 */
export interface CoveragePrompt {
  q: string;
  mentions?: string[];
}

export interface TemplateSection {
  key: ReportSectionKey;
  title: string;
  /** Guidance injected into the section prompt. */
  instructions: string;
  /** True if Rule 26(a)(2)(B) requires this section to be present. */
  rule26Required: boolean;
  /** Neutral coverage questions for the private challenge-readiness checklist. */
  coveragePrompts?: CoveragePrompt[];
  /**
   * If true, content must be grounded in evidence units (investigation, facts,
   * etc.). If false, it is expert-profile boilerplate (qualifications,
   * compensation) that does not require case-evidence grounding.
   */
  requiresEvidence: boolean;
}

export interface DisciplineTemplate {
  discipline: string;
  version: string;
  /** Citable standard this template encodes, e.g. "ASTM E3176-20". */
  standardRef?: string;
  sections: TemplateSection[];
}

/** A drafted (or expert-edited) section of a report. */
export interface ReportSection {
  key: ReportSectionKey;
  title: string;
  draftText: string;
  finalText?: string;
  /** Evidence units the draft text is grounded in. */
  citedEvidenceIds: string[];
  /** Sentences the grounding check could not tie to evidence — needs expert review. */
  ungroundedFlags: string[];
}

/**
 * A tabular exhibit attached to the report (labor-market survey, transferable-
 * skills table, earning-capacity comparison, etc.). The renderer treats `rows`
 * as opaque strings — exhibit data, like everything else, originates with the
 * expert/inputs and is never synthesized by the tool. `colFractions`, when
 * given, must sum to ~1 and match `columns.length`; otherwise columns are evenly
 * spaced.
 */
export interface ExhibitTable {
  /** Short label, e.g. "Exhibit A". */
  label: string;
  /** Human title, e.g. "Labor Market Survey — Commuting Area". */
  title: string;
  /** Optional methodology/scope line under the title. */
  caption?: string;
  columns: string[];
  rows: string[][];
  /** Optional source/vintage note printed under the table. */
  footnote?: string;
  /** Optional relative column widths (sum ≈ 1, length === columns.length). */
  colFractions?: number[];
}

/**
 * Append-only audit event. Every model call records exactly what it saw and
 * produced, linked to the section it generated. The AI-Disclosure Appendix is a
 * pure projection of these events — this is the product's moat.
 */
export interface AuditEvent {
  id: string;
  reportId: string;
  sectionKey: ReportSectionKey;
  prompt: string;
  model: string;
  modelVersion: string;
  /** Evidence-unit ids fed into this call (closed-world input set). */
  inputIds: string[];
  output: string;
  createdAt: string; // ISO-8601
  /**
   * SHA-256 of the previous event in this log's chain (64 zeros for the first).
   * Linking each entry to its predecessor makes the log tamper-evident: editing
   * or removing any past event breaks every hash after it.
   */
  prevHash: string;
  /** SHA-256 over this event's canonical content (including prevHash). */
  entryHash: string;
}

export interface ExpertProfile {
  fullName: string;
  credentials: string;
  /** Publications in the last 10 years (Rule 26(a)(2)(B)(iv)). */
  publicationsLast10yr: string[];
  /** Cases testified in over the last 4 years (Rule 26(a)(2)(B)(v)). */
  priorTestimonyLast4yr: string[];
  /** Statement of compensation (Rule 26(a)(2)(B)(vi)). */
  compensationStatement: string;
}

export interface ReportMeta {
  id: string;
  caseId: string;
  discipline: string;
  templateVersion: string;
  matter: string;
  retainingCounsel: string;
  expertRole: string;
}
