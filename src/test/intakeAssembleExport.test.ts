import { describe, it, expect } from "vitest";
import { assembleUserReport, type AssembleInput } from "@/lib/report/assemble";
import { exportReportDocx } from "@/lib/export/docx";
import { exportReportPdf } from "@/lib/export/pdf";
import { DEFAULT_STYLE } from "@/lib/export/style";

// End-to-end through the REAL pipeline (no mocks, no model — the rule-based path):
// intake-shaped input → assembleUserReport → grounding gate → export. The point is
// the EXISTENTIAL invariant: adversarial ADOPTED text (a fabricated figure or a
// hallucinated citation) must make a section "not clean" so the export route's 422
// gate refuses the deliverable, while genuinely clean content flows all the way to
// a valid DOCX/PDF. assemble.ts grounds finalText ?? draft, so finalText is the
// real attack surface.
function buildInput(opinionsFinalText: string): AssembleInput {
  return {
    meta: { matter: "Alvarez v. Brightline", retainingCounsel: "Doe LLP", expertRole: "Vocational expert" },
    profile: {
      fullName: "Dr. Pat Vega",
      credentials: "CRC, ABVE/F",
      publicationsLast10yr: [],
      priorTestimonyLast4yr: [],
      compensationStatement: "$400/hr, billed to retaining counsel.",
    },
    evidence: [
      { id: "e1", content: "The FCE limits the plaintiff to sedentary work.", location: "FCE p.3" },
      { id: "e2", content: "Pre-injury annual wage was $52,000.", location: "W-2 2019" },
    ],
    sections: [
      {
        key: "scope_of_assignment",
        evidenceIds: ["e1"],
        finalText: "Retained to assess post-injury earning capacity [[E:e1]].",
      },
      { key: "opinions", evidenceIds: ["e1", "e2"], finalText: opinionsFinalText },
    ],
  };
}

type Report = Awaited<ReturnType<typeof assembleUserReport>>;

// Mirror the export route's hard gate exactly: only NON-profile evidence sections
// that fail grounding block the deliverable (422 GROUNDING_BLOCKED).
function exportBlockers(report: Report) {
  return report.sections.filter((s) => !s.isProfile && !s.grounding.isClean);
}

describe("intake → assemble → export (rule-based, no model)", () => {
  it("BLOCKS a fabricated, uncited figure in the adopted opinion", async () => {
    const report = await assembleUserReport(
      buildInput("The plaintiff's lost earning capacity is exactly $1,200,000."),
      null,
    );
    const opinions = report.sections.find((s) => s.key === "opinions")!;
    expect(opinions.grounding.isClean).toBe(false);
    expect(opinions.grounding.ungroundedSentences.length).toBeGreaterThan(0);
    expect(exportBlockers(report).map((s) => s.key)).toContain("opinions");
  });

  it("BLOCKS a hallucinated citation to an id never fed to the section", async () => {
    const report = await assembleUserReport(
      buildInput("Sedentary capacity is retained [[E:e1]]; prior earnings were high [[E:e999]]."),
      null,
    );
    const opinions = report.sections.find((s) => s.key === "opinions")!;
    expect(opinions.grounding.isClean).toBe(false);
    expect(opinions.grounding.invalidCitationSentences.length).toBeGreaterThan(0);
    expect(exportBlockers(report).length).toBeGreaterThan(0);
  });

  it("ALLOWS clean, fully-cited adopted text (the gate passes)", async () => {
    const report = await assembleUserReport(
      buildInput(
        "The plaintiff retains sedentary capacity [[E:e1]]. Pre-injury annual wage was $52,000 [[E:e2]].",
      ),
      null,
    );
    const opinions = report.sections.find((s) => s.key === "opinions")!;
    expect(opinions.grounding.isClean).toBe(true);
    expect(exportBlockers(report)).toHaveLength(0);
  });

  it("does NOT block on an explicit [Expert input needed] placeholder (a draft may still export)", async () => {
    const report = await assembleUserReport(
      buildInput(
        "The plaintiff retains sedentary capacity [[E:e1]]. [Expert input needed: a labor-market survey.]",
      ),
      null,
    );
    const opinions = report.sections.find((s) => s.key === "opinions")!;
    expect(opinions.grounding.placeholderSentences.length).toBeGreaterThan(0);
    expect(opinions.grounding.isClean).toBe(true); // a flagged gap is not a fabrication
    expect(exportBlockers(report)).toHaveLength(0);
  });

  it("renders a clean report all the way to a valid DOCX and PDF deliverable", async () => {
    const report = await assembleUserReport(
      buildInput(
        "The plaintiff retains sedentary capacity [[E:e1]]. Pre-injury annual wage was $52,000 [[E:e2]].",
      ),
      null,
    );
    expect(exportBlockers(report)).toHaveLength(0);
    const args = {
      meta: report.meta,
      sections: report.exportSections,
      disclosure: report.appendix,
      reconstructions: report.reconstructions,
      readiness: report.readiness,
      expert: { fullName: report.profile.fullName, credentials: report.profile.credentials },
      style: DEFAULT_STYLE,
    };
    const docx = await exportReportDocx(args);
    expect(docx.subarray(0, 2).toString("latin1")).toBe("PK"); // .docx is a zip
    const pdf = await exportReportPdf(args);
    expect(pdf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("discloses the no-model build honestly and verifies its own audit chain", async () => {
    const report = await assembleUserReport(buildInput("Sedentary capacity is retained [[E:e1]]."), null);
    expect(report.appendix.integrity.verified).toBe(true);
    // No generative model touched it → the disclosure must say so, never claim AI.
    expect(report.appendix.statement).toMatch(/no generative AI|rule-based/i);
  });
});
