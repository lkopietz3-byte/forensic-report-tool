import type { AuditEvent, ExpertProfile, ReportSectionKey } from "../domain/types";
import type { AssembleInput, AssembledReport } from "./assemble";

// Pure, framework-free mappers between the builder's domain objects and the
// Supabase row shapes (snake_case). Kept side-effect-free so they unit-test
// without a database — the routes do the actual I/O. The audit mappers are the
// load-bearing ones: they must round-trip every field bound into the hash chain
// so verifyAuditChain still detects tampering after a save→load cycle.

export interface EvidenceRow {
  ref_id: string;
  content: string;
  location: string;
  section_key: string | null;
}

export interface SectionRow {
  section_key: string;
  draft_text: string;
  final_text: string | null;
  cited_evidence_ids: string[];
  ungrounded_flags: string[];
}

export interface AuditRow {
  seq: number;
  event_id: string;
  chain_report_id: string;
  section_key: string;
  prompt: string;
  model: string;
  model_version: string;
  input_ids: string[];
  output: string;
  created_at_iso: string;
  prev_hash: string;
  entry_hash: string;
}

export interface ProfileRow {
  full_name: string;
  credentials: string;
  publications_last_10yr: string[];
  prior_testimony_last_4yr: string[];
  compensation_statement: string;
}

/** Builder input → evidence rows, tagging each unit with the section it's in. */
export function toEvidenceRows(input: AssembleInput): EvidenceRow[] {
  const sectionByEvidence = new Map<string, string>();
  for (const s of input.sections) {
    for (const id of s.evidenceIds) sectionByEvidence.set(id, s.key);
  }
  return input.evidence.map((u) => ({
    ref_id: u.id,
    content: u.content,
    location: u.location,
    section_key: sectionByEvidence.get(u.id) ?? null,
  }));
}

/** Assembled output → report_sections rows (the rendered draft per section). */
export function toSectionRows(report: AssembledReport): SectionRow[] {
  return report.exportSections.map((s) => ({
    section_key: s.key,
    draft_text: s.draftText,
    final_text: s.finalText ?? null,
    cited_evidence_ids: s.citedEvidenceIds,
    ungrounded_flags: s.ungroundedFlags,
  }));
}

/** Audit chain → audit_events rows. Persists every hashed field verbatim. */
export function toAuditRows(report: AssembledReport): AuditRow[] {
  return report.appendix.rawEvents.map((e, i) => ({
    seq: i,
    event_id: e.id,
    chain_report_id: e.reportId,
    section_key: e.sectionKey,
    prompt: e.prompt,
    model: e.model,
    model_version: e.modelVersion,
    input_ids: [...e.inputIds],
    output: e.output,
    created_at_iso: e.createdAt,
    prev_hash: e.prevHash,
    entry_hash: e.entryHash,
  }));
}

export function toProfileRow(profile: ExpertProfile): ProfileRow {
  return {
    full_name: profile.fullName,
    credentials: profile.credentials,
    publications_last_10yr: profile.publicationsLast10yr ?? [],
    prior_testimony_last_4yr: profile.priorTestimonyLast4yr ?? [],
    compensation_statement: profile.compensationStatement,
  };
}

/**
 * audit_events rows → AuditEvent[] in stored order. Reconstructs the EXACT
 * object that was hashed, so verifyAuditChain() can recompute and compare —
 * detecting any field a DBA might have edited in the table after the fact.
 */
export function auditRowsToEvents(rows: AuditRow[]): AuditEvent[] {
  return [...rows]
    .sort((a, b) => a.seq - b.seq)
    .map((r) => ({
    id: r.event_id,
    reportId: r.chain_report_id,
    sectionKey: r.section_key as ReportSectionKey,
    prompt: r.prompt,
    model: r.model,
    modelVersion: r.model_version,
    inputIds: [...r.input_ids],
    output: r.output,
    createdAt: r.created_at_iso,
    prevHash: r.prev_hash,
    entryHash: r.entry_hash,
  }));
}

export function profileRowToProfile(row: ProfileRow | null): ExpertProfile {
  return {
    fullName: row?.full_name ?? "",
    credentials: row?.credentials ?? "",
    publicationsLast10yr: row?.publications_last_10yr ?? [],
    priorTestimonyLast4yr: row?.prior_testimony_last_4yr ?? [],
    compensationStatement: row?.compensation_statement ?? "",
  };
}

/**
 * Rehydrate the builder's AssembleInput from stored rows — the inverse of a
 * save. Evidence regains its logical id + section assignment; each chosen
 * section regains its expert edit (final_text). This is what lets a saved
 * report reopen in the workspace exactly as entered.
 */
export function rowsToAssembleInput(args: {
  meta: AssembleInput["meta"];
  profile: ExpertProfile;
  evidenceRows: EvidenceRow[];
  sectionRows: SectionRow[];
}): AssembleInput {
  const { meta, profile, evidenceRows, sectionRows } = args;
  const evidence = evidenceRows.map((r) => ({
    id: r.ref_id,
    content: r.content,
    location: r.location,
  }));

  const idsBySection = new Map<string, string[]>();
  for (const r of evidenceRows) {
    if (!r.section_key) continue;
    const arr = idsBySection.get(r.section_key) ?? [];
    arr.push(r.ref_id);
    idsBySection.set(r.section_key, arr);
  }

  const sections = sectionRows.map((s) => {
    // A unit cited in MORE THAN ONE section is stored with a single section_key on
    // its evidence row (last-wins in toEvidenceRows), so every other section that
    // cited it would lose it on reload and its [[E:id]] cite would then read as an
    // INVALID citation — a false closed-world breach that blocks re-export. The
    // section's own stored cited_evidence_ids already records every id it cited, so
    // union those back in to preserve the many-to-many faithfully. (Assigned-but-
    // uncited evidence is only re-fed to its one section_key, which is harmless —
    // an uncited unit can't produce an invalid cite.)
    const assigned = idsBySection.get(s.section_key) ?? [];
    const evidenceIds = [...new Set([...assigned, ...s.cited_evidence_ids])];
    return {
      key: s.section_key,
      evidenceIds,
      finalText: s.final_text ?? undefined,
    };
  });

  return { meta, profile, evidence, sections };
}
