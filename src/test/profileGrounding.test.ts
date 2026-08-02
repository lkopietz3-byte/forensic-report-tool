import { describe, it, expect } from "vitest";
import { assembleUserReport, type AssembleInput } from "@/lib/report/assemble";

// A harsh audit found profile sections (qualifications / compensation / prior
// testimony) shipped arbitrary finalText with ZERO grounding and were exempt
// from the export gate — so an injected/hand-edited ghost citation ([[E:id]]
// where a profile cites no evidence) was silently stripped and a fabricated
// figure shipped under signature. Profiles now ground against an EMPTY allowed
// set: any marker is an invalid ghost cite that BLOCKS, while ordinary un-cited
// boilerplate is fine.

function input(compensationFinalText?: string): AssembleInput {
  return {
    meta: { matter: "Alvarez v. Brightline", retainingCounsel: "Doe LLP", expertRole: "Vocational expert" },
    profile: {
      fullName: "Dr. Pat Vega",
      credentials: "CRC, ABVE/F",
      publicationsLast10yr: [],
      priorTestimonyLast4yr: [],
      compensationStatement: "$400/hr, billed to retaining counsel.",
    },
    evidence: [{ id: "e1", content: "The FCE limits the plaintiff to sedentary work.", location: "FCE p.3" }],
    sections: [
      { key: "opinions", evidenceIds: ["e1"], finalText: "Sedentary capacity is retained [[E:e1]]." },
      ...(compensationFinalText !== undefined
        ? [{ key: "compensation", evidenceIds: [], finalText: compensationFinalText }]
        : []),
    ],
  };
}

// Mirror the real export gate: non-profile sections block on any grounding
// failure; profile sections block ONLY on an invalid (ghost) citation.
function isBlocked(report: Awaited<ReturnType<typeof assembleUserReport>>): boolean {
  return report.sections.some((s) =>
    s.isProfile ? s.grounding.invalidCitationSentences.length > 0 : !s.grounding.isClean,
  );
}

describe("profile sections — ghost citations are blocked", () => {
  it("blocks a hand-injected ghost [[E:id]] in a profile section", async () => {
    const report = await assembleUserReport(
      input("Compensation is $400 per hour, and the plaintiff will lose $2,000,000 [[E:ghost]]."),
      null,
    );
    const comp = report.sections.find((s) => s.key === "compensation")!;
    expect(comp.isProfile).toBe(true);
    expect(comp.grounding.invalidCitationSentences.length).toBeGreaterThan(0);
    expect(isBlocked(report)).toBe(true);
  });

  it("treats even a REAL evidence id as a ghost cite in a profile (profiles cite nothing)", async () => {
    const report = await assembleUserReport(
      input("The evaluee's lifetime loss is $9,000,000 [[E:e1]]."),
      null,
    );
    const comp = report.sections.find((s) => s.key === "compensation")!;
    expect(comp.grounding.invalidCitationSentences.length).toBeGreaterThan(0);
    expect(isBlocked(report)).toBe(true);
  });

  it("does NOT block ordinary un-cited profile boilerplate", async () => {
    const report = await assembleUserReport(
      input("Compensation is $400 per hour for review and $500 per hour for testimony. It is not contingent on the outcome."),
      null,
    );
    const comp = report.sections.find((s) => s.key === "compensation")!;
    expect(comp.isProfile).toBe(true);
    expect(comp.grounding.invalidCitationSentences).toEqual([]);
    expect(isBlocked(report)).toBe(false);
  });
});
