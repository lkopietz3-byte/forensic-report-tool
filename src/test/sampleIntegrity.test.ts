import { describe, expect, it } from "vitest";
import { buildSampleReport, ENGINEERING_SAMPLE, RECONSTRUCTION_SAMPLE, SAMPLE_EVIDENCE } from "@/lib/domain/sample";

// End-to-end integrity of the showcase report. If any of these break, the demo
// is silently making a claim the product promises it never makes — a fabricated
// citation, an opinion the tool originated, a broken audit chain, or a number
// that disagrees with itself. These are the legal guarantees, asserted on the
// real pipeline output.

const report = buildSampleReport();
const evidenceIds = new Set(SAMPLE_EVIDENCE.map((u) => u.id));

describe("sample report — grounding integrity", () => {
  it("has no invalid (hallucinated) citations in any section", () => {
    for (const s of report.sections) {
      expect(
        s.grounding.invalidCitationSentences,
        `${s.key} cites an id outside its fed set`,
      ).toEqual([]);
    }
  });

  it("every evidence-backed section is clean (no ungrounded sentences)", () => {
    const evidenceSections = report.sections.filter((s) => s.fedEvidenceIds.length > 0);
    expect(evidenceSections.length).toBeGreaterThan(8);
    for (const s of evidenceSections) {
      expect(s.grounding.isClean, `${s.key} has ungrounded sentences`).toBe(true);
    }
  });

  it("cites only evidence that was actually fed (closed-world holds)", () => {
    for (const s of report.sections) {
      for (const id of s.grounding.citedEvidenceIds) {
        expect(s.fedEvidenceIds, `${s.key} cited unfed ${id}`).toContain(id);
        expect(evidenceIds, `${s.key} cited unknown ${id}`).toContain(id);
      }
    }
  });
});

describe("sample report — data-to-opinion integrity", () => {
  it("no opinion relies on evidence that was never fed (the fabrication alarm)", () => {
    for (const r of report.reconstructions) {
      expect(
        r.reliedOnButNeverFed,
        `${r.sectionKey} relies on evidence never fed to the tool`,
      ).toEqual([]);
    }
  });

  it("every relied-on / considered source resolves to a real evidence unit", () => {
    for (const r of report.reconstructions) {
      for (const src of [...r.reliedOn, ...r.fedButNotReliedOn]) {
        expect(evidenceIds, `${r.sectionKey} → ${src.id}`).toContain(src.id);
        expect(src.location).not.toBe("(source not found)");
      }
    }
  });
});

describe("sample report — disclosure is a faithful projection", () => {
  it("the audit chain backing the appendix verifies", () => {
    expect(report.appendix.integrity.verified).toBe(true);
  });

  it("discloses only real sources and real models — invents nothing", () => {
    for (const entry of report.appendix.entries) {
      expect(entry.model).toBeTruthy();
      expect(entry.modelVersion).toBeTruthy();
      for (const src of entry.evidenceSources) {
        expect(evidenceIds, `disclosed unknown ${src.id}`).toContain(src.id);
        expect(src.location).not.toBe("(source not found)");
      }
    }
    // Models list is derived from the events, formatted "model (version)".
    expect(report.appendix.models.length).toBeGreaterThan(0);
    for (const m of report.appendix.models) expect(m).toMatch(/.+\(.+\)/);
  });

  it("the disclosure statement avoids admissibility/over-claims", () => {
    const s = report.appendix.statement;
    expect(s).not.toMatch(/admissib/i);
    expect(s).not.toMatch(/court[\s-]?defensible/i);
    expect(s).not.toMatch(/tamper[\s-]?proof/i);
    expect(s).not.toMatch(/closed-world/i); // jargon must stay out of the filed statement
    expect(s).toMatch(/restrict the model to the evidence the expert supplied/i);
    expect(s).toMatch(/does not independently prove[\s\S]*supports the sentence/i);
    expect(s).toMatch(/solely responsible/i);
  });
});

describe("sample report — Rule 26 + exhibits", () => {
  it("contains every Rule 26(a)(2)(B) required element", () => {
    expect(report.rule26.ok, JSON.stringify(report.rule26.issues)).toBe(true);
  });

  it("exhibit SOC codes are well-formed (NN-NNNN)", () => {
    const exB = report.exhibits.find((e) => e.label === "Exhibit B");
    expect(exB).toBeTruthy();
    const socCol = exB!.columns.findIndex((c) => /SOC/i.test(c));
    expect(socCol).toBeGreaterThanOrEqual(0);
    for (const row of exB!.rows) {
      expect(row[socCol], `bad SOC ${row[socCol]}`).toMatch(/^\d{2}-\d{4}$/);
    }
  });

  it("keeps the pre/post-injury figures internally consistent", () => {
    const text = report.sections.map((s) => s.draftText).join(" ");
    // Pre-injury capacity is the same $72,400 everywhere it appears.
    expect(text).toMatch(/72,400/);
    // Post-injury surveyed band $44,000–$52,000.
    expect(text).toMatch(/44,000/);
    expect(text).toMatch(/52,000/);
    // Exhibit C states the same pre-injury figure and the real BLS median.
    const exC = report.exhibits.find((e) => e.label === "Exhibit C");
    const flat = (exC?.rows ?? []).flat().join(" ");
    expect(flat).toMatch(/72,400/);
    expect(flat).toMatch(/59,810/); // BLS OEWS May-2024 median for SOC 49-9021
  });
});

// The discipline previews are illustrations, but each must honor the SAME
// invariants — they run the real pipeline, so a fabricated cite or a broken
// chain would be just as damaging here as in the live discipline.
for (const sample of [ENGINEERING_SAMPLE, RECONSTRUCTION_SAMPLE]) {
  describe(`${sample.kind} preview sample — same grounding guarantees`, () => {
    const built = buildSampleReport(sample);
    const ids = new Set(sample.evidence.map((u) => u.id));

    it("has no invalid (hallucinated) citations", () => {
      for (const s of built.sections)
        expect(s.grounding.invalidCitationSentences, s.key).toEqual([]);
    });

    it("every evidence-backed section is clean (placeholders aside)", () => {
      for (const s of built.sections.filter((x) => x.fedEvidenceIds.length > 0))
        expect(s.grounding.isClean, `${s.key} has ungrounded prose`).toBe(true);
    });

    it("closed-world holds, no fabrication alarm, audit verifies, Rule 26 complete", () => {
      for (const s of built.sections)
        for (const id of s.grounding.citedEvidenceIds)
          expect(ids, `${s.key} cited unknown ${id}`).toContain(id);
      for (const r of built.reconstructions)
        expect(r.reliedOnButNeverFed, r.sectionKey).toEqual([]);
      expect(built.appendix.integrity.verified).toBe(true);
      expect(built.rule26.ok, JSON.stringify(built.rule26.issues)).toBe(true);
    });
  });
}
