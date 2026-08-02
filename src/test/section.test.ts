import { describe, expect, it } from "vitest";
import { AuditLog } from "../lib/domain/audit.js";
import { draftSection } from "../lib/draft/section.js";
import type { EvidenceUnit, TemplateSection } from "../lib/domain/types.js";
import type { LLMClient, LLMCompletion } from "../lib/draft/llm.js";

const SECTION: TemplateSection = {
  key: "background",
  title: "Background",
  instructions: "Summarize the background facts the expert supplied.",
  rule26Required: false,
  requiresEvidence: true,
};

const UNITS: EvidenceUnit[] = [
  { id: "E1", inputId: "intake", content: "Claimant is 47 years old", location: "Intake ¶1" },
  { id: "E2", inputId: "intake", content: "He last worked as a welder", location: "Intake ¶2" },
];

class MockLLM implements LLMClient {
  public calls: { system: string; user: string }[] = [];
  constructor(private readonly reply: string) {}
  async complete(args: { system: string; user: string }): Promise<LLMCompletion> {
    this.calls.push(args);
    return { text: this.reply, model: "mock-model", modelVersion: "mock-1" };
  }
}

describe("draftSection deterministic structuring (no model)", () => {
  it("re-emits each unit as one grounded sentence carrying its own citation", async () => {
    const audit = new AuditLog();
    const result = await draftSection({
      reportId: "r1",
      section: SECTION,
      units: UNITS,
      llm: null,
      audit,
    });

    expect(result.mode).toBe("structured");
    expect(result.model).toBe("deterministic-structurer");
    expect(result.draftText).toContain("[[E:E1]]");
    expect(result.draftText).toContain("[[E:E2]]");
    // Originates nothing: the expert's words survive verbatim.
    expect(result.draftText).toContain("Claimant is 47 years old");
    expect(result.grounding.isClean).toBe(true);
    expect(result.grounding.citedEvidenceIds.sort()).toEqual(["E1", "E2"]);
    expect(result.fedEvidenceIds).toEqual(["E1", "E2"]);
  });

  it("keeps a MULTI-SENTENCE unit fully grounded (cites every sentence)", async () => {
    const audit = new AuditLog();
    const result = await draftSection({
      reportId: "r1",
      section: SECTION,
      units: [
        {
          id: "E1",
          inputId: "i",
          content: "The FCE was administered on March 2, 2025. Lifting is limited to 20 lbs occasionally. Dr. Okonkwo signed the report.",
          location: "FCE p.6",
        },
      ],
      llm: null,
      audit,
    });
    // Every sentence carries the citation; none reads as ungrounded.
    expect(result.grounding.isClean).toBe(true);
    expect(result.grounding.ungroundedSentences).toEqual([]);
    expect(result.draftText).toContain("administered on March 2, 2025 [[E:E1]].");
    expect(result.draftText).toContain("Dr. Okonkwo signed the report [[E:E1]].");
  });

  it("records the deterministic transform in the audit log before grounding", async () => {
    const audit = new AuditLog();
    await draftSection({ reportId: "r1", section: SECTION, units: UNITS, llm: null, audit });
    const events = audit.all();
    expect(events).toHaveLength(1);
    expect(events[0].model).toBe("deterministic-structurer");
    expect(events[0].inputIds).toEqual(["E1", "E2"]);
    expect(events[0].sectionKey).toBe("background");
  });
});

describe("draftSection live (model-backed)", () => {
  it("structures via the model and records the real prompt + model", async () => {
    const llm = new MockLLM("He last worked as a welder. [[E:E2]]");
    const audit = new AuditLog();
    const result = await draftSection({
      reportId: "r1",
      section: SECTION,
      units: UNITS,
      llm,
      audit,
    });

    expect(result.mode).toBe("live");
    expect(result.model).toBe("mock-model");
    expect(result.grounding.citedEvidenceIds).toEqual(["E2"]);
    expect(llm.calls).toHaveLength(1);
    expect(audit.all()[0].model).toBe("mock-model");
  });

  it("flags a hallucinated citation to an id never fed in", async () => {
    const llm = new MockLLM("An invented claim. [[E:E9]]");
    const audit = new AuditLog();
    const result = await draftSection({
      reportId: "r1",
      section: SECTION,
      units: UNITS,
      llm,
      audit,
    });
    expect(result.grounding.isClean).toBe(false);
    expect(result.grounding.invalidCitationSentences.length).toBeGreaterThan(0);
  });
});
