import { describe, expect, it } from "vitest";
import {
  extractEvidence,
  heuristicExtract,
  parseExtractionResponse,
  verifiedModelUnits,
  MAX_UNITS,
} from "../lib/draft/extract.js";
import type { LLMClient, LLMCompletion } from "../lib/draft/llm.js";

class MockLLM implements LLMClient {
  constructor(private readonly reply: string) {}
  async complete(): Promise<LLMCompletion> {
    return { text: this.reply, model: "mock-model", modelVersion: "mock-1" };
  }
}

describe("heuristicExtract", () => {
  it("splits on blank-line paragraphs and emits faithful spans", () => {
    const units = heuristicExtract({
      text: "The beam buckled under load.\n\nThe weld showed porosity.",
      sourceLabel: "Site report",
    });
    expect(units).toHaveLength(2);
    expect(units[0]).toEqual({
      content: "The beam buckled under load.",
      location: "Site report ¶1",
    });
    expect(units[1].content).toBe("The weld showed porosity.");
    expect(units[1].location).toBe("Site report ¶2");
  });

  it("never alters the wording of the supplied text", () => {
    const text = "Claimant earned $52,340 in 2021 per the W-2.";
    const units = heuristicExtract({ text, sourceLabel: "Wages" });
    expect(units[0].content).toBe(text);
  });

  it("falls back to a default label when none is provided", () => {
    const units = heuristicExtract({ text: "A single fact.", sourceLabel: "   " });
    expect(units[0].location).toBe("Document ¶1");
  });

  it("caps output at MAX_UNITS", () => {
    const text = Array.from({ length: MAX_UNITS + 10 }, (_, i) => `Fact ${i}.`).join(
      "\n\n",
    );
    const units = heuristicExtract({ text, sourceLabel: "Doc" });
    expect(units.length).toBeLessThanOrEqual(MAX_UNITS);
  });
});

describe("parseExtractionResponse", () => {
  it("parses a clean JSON array of well-formed units", () => {
    const raw = '[{"content":"A fact.","location":"p.1"}]';
    expect(parseExtractionResponse(raw)).toEqual([
      { content: "A fact.", location: "p.1" },
    ]);
  });

  it("strips accidental markdown fences", () => {
    const raw = '```json\n[{"content":"A fact.","location":"p.1"}]\n```';
    expect(parseExtractionResponse(raw)).toHaveLength(1);
  });

  it("drops malformed items rather than guessing", () => {
    const raw =
      '[{"content":"Good.","location":"p.1"},{"content":42},{"location":"p.2"},{"content":"  ","location":"p.3"}]';
    const units = parseExtractionResponse(raw);
    expect(units).toEqual([{ content: "Good.", location: "p.1" }]);
  });

  it("returns empty on non-array or unparseable input", () => {
    expect(parseExtractionResponse("not json")).toEqual([]);
    expect(parseExtractionResponse('{"content":"x"}')).toEqual([]);
  });
});

describe("extractEvidence", () => {
  it("uses the live model only for text verified to exist in the source", async () => {
    const llm = new MockLLM('[{"content":"Live fact.","location":"p.2"}]');
    const result = await extractEvidence({
      text: "Header\n\nLive fact.\n\nFooter",
      sourceLabel: "Doc",
      llm,
    });
    expect(result.mode).toBe("live");
    expect(result.units[0].content).toBe("Live fact.");
    expect(result.units[0].location).toBe("Doc (verified excerpt 1)");
  });

  it("drops hallucinated model text and falls back to faithful heuristic extraction", async () => {
    const llm = new MockLLM(
      '[{"content":"The claimant earned $900,000.","location":"invented p.99"}]',
    );
    const result = await extractEvidence({
      text: "The source contains no wage figure.",
      sourceLabel: "Source",
      llm,
    });
    expect(result.mode).toBe("heuristic");
    expect(result.units).toEqual([
      { content: "The source contains no wage figure.", location: "Source ¶1" },
    ]);
  });

  it("falls back to the heuristic when the model yields nothing usable", async () => {
    const llm = new MockLLM("garbage, no array");
    const result = await extractEvidence({
      text: "A paragraph of evidence.",
      sourceLabel: "Doc",
      llm,
    });
    expect(result.mode).toBe("heuristic");
    expect(result.units[0].content).toBe("A paragraph of evidence.");
  });

  it("uses the heuristic directly when no client is provided", async () => {
    const result = await extractEvidence({
      text: "First.\n\nSecond.",
      sourceLabel: "Doc",
      llm: null,
    });
    expect(result.mode).toBe("heuristic");
    expect(result.units).toHaveLength(2);
  });
});

describe("verifiedModelUnits", () => {
  it("normalizes whitespace but never accepts a paraphrase", () => {
    const units = verifiedModelUnits({
      units: [
        { content: "The weld showed porosity.", location: "made up p.8" },
        { content: "Porosity was present in the weld.", location: "p.1" },
      ],
      sourceText: "The weld   showed\nporosity.",
      sourceLabel: "Inspection",
    });
    expect(units).toEqual([
      {
        content: "The weld showed porosity.",
        location: "Inspection (verified excerpt 1)",
      },
    ]);
  });

  it("deduplicates repeated model spans and ignores model-provided locators", () => {
    const units = verifiedModelUnits({
      units: [
        { content: "Exact sentence.", location: "p.999" },
        { content: "Exact sentence.", location: "p.1" },
      ],
      sourceText: "Exact sentence.",
      sourceLabel: "Report",
    });
    expect(units).toHaveLength(1);
    expect(units[0].location).toBe("Report (verified excerpt 1)");
  });
});
