import { describe, expect, it } from "vitest";
import { AuditLog } from "../lib/domain/audit.js";
import { draftReport } from "../lib/draft/pipeline.js";
import type { LLMClient, LLMCompletion } from "../lib/draft/llm.js";
import { PLACEHOLDER_TEMPLATE } from "../lib/domain/template.js";
import type {
  EvidenceUnit,
  ExpertProfile,
  ReportSectionKey,
} from "../lib/domain/types.js";

const evidence: EvidenceUnit[] = [
  { id: "e1", inputId: "i1", content: "Weld cracked at joint A.", location: "Photo 7" },
  { id: "e2", inputId: "i1", content: "Measured load 12 kN.", location: "Calc p.3" },
];

const profile: ExpertProfile = {
  fullName: "Dr. Jane Roe, P.E.",
  credentials: "Ph.D. Structural Engineering, P.E.",
  publicationsLast10yr: ["Fatigue in Welded Joints (2021)"],
  priorTestimonyLast4yr: ["Doe v. Acme (2024), deposition"],
  compensationStatement: "Billed at $450/hr; opinions not contingent on outcome.",
};

/** Records what it was asked and replies with a per-section canned answer. */
class MockLLM implements LLMClient {
  public calls: { system: string; user: string }[] = [];
  constructor(private readonly replyFor: (user: string) => string) {}
  async complete(args: { system: string; user: string }): Promise<LLMCompletion> {
    this.calls.push(args);
    return {
      text: this.replyFor(args.user),
      model: "mock-model",
      modelVersion: "mock-1",
    };
  }
}

function evidenceSectionKeys(): ReportSectionKey[] {
  return PLACEHOLDER_TEMPLATE.sections
    .filter((s) => s.requiresEvidence)
    .map((s) => s.key);
}

describe("draftReport", () => {
  it("renders profile sections deterministically without calling the LLM for them", async () => {
    const llm = new MockLLM(() => "Grounded sentence [[E:e1]].");
    const { sections } = await draftReport({
      reportId: "r1",
      template: PLACEHOLDER_TEMPLATE,
      evidence,
      profile,
      llm,
      audit: new AuditLog(),
    });

    const quals = sections.find((s) => s.key === "qualifications");
    expect(quals?.draftText).toContain("Dr. Jane Roe");
    expect(quals?.citedEvidenceIds).toEqual([]);

    const comp = sections.find((s) => s.key === "compensation");
    expect(comp?.draftText).toContain("$450/hr");

    // Only the evidence-required sections should have hit the model.
    expect(llm.calls).toHaveLength(evidenceSectionKeys().length);
  });

  it("records one audit event per LLM-drafted section with the exact inputs", async () => {
    const audit = new AuditLog();
    const llm = new MockLLM(() => "Grounded [[E:e1]].");
    await draftReport({
      reportId: "r1",
      template: PLACEHOLDER_TEMPLATE,
      evidence,
      profile,
      llm,
      audit,
    });

    const events = audit.forReport("r1");
    expect(events).toHaveLength(evidenceSectionKeys().length);
    for (const e of events) {
      expect(e.model).toBe("mock-model");
      expect(e.modelVersion).toBe("mock-1");
      expect(e.inputIds).toEqual(["e1", "e2"]);
      expect(e.prompt).toContain("SYSTEM");
    }
  });

  it("flags ungrounded and invalid-citation sentences for expert review", async () => {
    // Reply has: one grounded sentence, one ungrounded, one hallucinated-cite.
    const llm = new MockLLM(
      () => "Good [[E:e1]]. Bare assertion. Bad cite [[E:e999]].",
    );
    const { sections } = await draftReport({
      reportId: "r1",
      template: PLACEHOLDER_TEMPLATE,
      evidence,
      profile,
      llm,
      audit: new AuditLog(),
    });

    const opinions = sections.find((s) => s.key === "opinions");
    expect(opinions?.citedEvidenceIds).toEqual(["e1"]);
    expect(opinions?.ungroundedFlags).toEqual(
      expect.arrayContaining(["Bare assertion.", "Bad cite [[E:e999]]."]),
    );
  });

  it("feeds a section only its mapped evidence subset when provided", async () => {
    const llm = new MockLLM(() => "Grounded [[E:e2]].");
    await draftReport({
      reportId: "r1",
      template: PLACEHOLDER_TEMPLATE,
      evidence,
      evidenceBySection: { opinions: ["e2"] },
      profile,
      llm,
      audit: new AuditLog(),
    });

    const opinionsCall = llm.calls.find((c) => c.user.includes("Opinions"));
    expect(opinionsCall?.user).toContain("e2");
    expect(opinionsCall?.user).not.toContain("id=e1");
  });
});
