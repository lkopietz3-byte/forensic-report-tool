import { describe, expect, it } from "vitest";
import { assembleUserReport } from "@/lib/report/assemble";

// The user-report engine: same integrity guarantees as the sample pipeline, but
// driven by the expert's own evidence. If these break, the product can fabricate
// or mis-disclose on a real report.

describe("assembleUserReport", () => {
  const input = {
    meta: { matter: "Doe v. Roe", retainingCounsel: "Smith LLP", expertRole: "Vocational expert" },
    profile: {
      fullName: "Pat Lee, M.S., CRC",
      credentials: "Certified Rehabilitation Counselor",
      publicationsLast10yr: [],
      priorTestimonyLast4yr: [],
      compensationStatement: "$300/hour for review; not contingent on outcome.",
    },
    evidence: [
      { id: "E1", inputId: "i", content: "Permanent restriction: no lifting over 25 pounds", location: "Dr. Reyes p.3" },
      { id: "E2", inputId: "i", content: "Pre-injury wages averaged $70,000 per year", location: "W-2 records" },
    ],
    sections: [
      { key: "functional_capacity", evidenceIds: ["E1"] },
      { key: "earning_capacity", evidenceIds: ["E2"] },
      { key: "compensation", evidenceIds: [] },
    ],
  };

  it("drafts the chosen sections in template order", async () => {
    const r = await assembleUserReport(input);
    expect(r.sections.map((s) => s.key)).toEqual([
      "functional_capacity",
      "earning_capacity",
      "compensation",
    ]);
  });

  it("grounds each evidence section in only the evidence the expert assigned to it", async () => {
    const r = await assembleUserReport(input);
    const fc = r.sections.find((s) => s.key === "functional_capacity")!;
    expect(fc.grounding.isClean).toBe(true);
    expect(fc.grounding.citedEvidenceIds).toEqual(["E1"]);
    expect(fc.text).toContain("E1");
    const ec = r.sections.find((s) => s.key === "earning_capacity")!;
    expect(ec.grounding.citedEvidenceIds).toEqual(["E2"]); // closed-world: not E1
  });

  it("grounds the ADOPTED text: an injected finalText citing an unfed id is flagged (export gate trips)", async () => {
    const tampered = {
      ...input,
      sections: [
        // finalText cites E9 — an id never fed to this section.
        { key: "functional_capacity", evidenceIds: ["E1"], finalText: "The claimant can lift 200 pounds [[E:E9]]." },
        { key: "earning_capacity", evidenceIds: ["E2"] },
        { key: "compensation", evidenceIds: [] },
      ],
    };
    const r = await assembleUserReport(tampered);
    const fc = r.sections.find((s) => s.key === "functional_capacity")!;
    // The adopted (edited) text is grounded, not the draft — so the ghost cite
    // is caught and the section is NOT clean. The export route refuses on this.
    expect(fc.grounding.isClean).toBe(false);
    expect(fc.grounding.invalidCitationSentences.length).toBeGreaterThan(0);
    // And the gate's predicate (non-profile && !isClean) selects it.
    const blocked = r.sections.filter((s) => !s.isProfile && !s.grounding.isClean);
    expect(blocked.map((s) => s.key)).toContain("functional_capacity");
  });

  it("flags an ungrounded invented number (no citation) so the export gate trips", async () => {
    const tampered = {
      ...input,
      sections: [
        { key: "functional_capacity", evidenceIds: ["E1"] },
        // A factual sentence with NO citation marker — an invented figure.
        { key: "earning_capacity", evidenceIds: ["E2"], finalText: "Lost earning capacity totals $2,000,000." },
        { key: "compensation", evidenceIds: [] },
      ],
    };
    const r = await assembleUserReport(tampered);
    const ec = r.sections.find((s) => s.key === "earning_capacity")!;
    expect(ec.grounding.isClean).toBe(false);
    expect(ec.grounding.ungroundedSentences.length).toBeGreaterThan(0);
  });

  it("a clean report has every evidence section grounded (export gate passes)", async () => {
    const r = await assembleUserReport(input);
    const blocked = r.sections.filter((s) => !s.isProfile && !s.grounding.isClean);
    expect(blocked).toEqual([]);
  });

  it("fills profile sections from the profile with no AI call", async () => {
    const r = await assembleUserReport(input);
    const comp = r.sections.find((s) => s.key === "compensation")!;
    expect(comp.isProfile).toBe(true);
    expect(comp.text).toContain("$300/hour");
    // profile section makes no model call → no disclosure entry for it
    expect(r.appendix.entries.map((e) => e.sectionKey)).toEqual([
      "functional_capacity",
      "earning_capacity",
    ]);
  });

  it("produces a verified disclosure chain and no fabricated provenance", async () => {
    const r = await assembleUserReport(input);
    expect(r.appendix.integrity.verified).toBe(true);
    for (const rec of r.reconstructions) {
      expect(rec.reliedOnButNeverFed).toEqual([]);
    }
  });

  it("honors the expert's edited finalText for a section", async () => {
    const r = await assembleUserReport({
      ...input,
      sections: [
        { key: "functional_capacity", evidenceIds: ["E1"], finalText: "The expert adopts the 25-pound restriction [[E:E1]]." },
      ],
    });
    const fc = r.sections.find((s) => s.key === "functional_capacity")!;
    expect(fc.text).toBe("The expert adopts the 25-pound restriction [[E:E1]].");
  });
});
