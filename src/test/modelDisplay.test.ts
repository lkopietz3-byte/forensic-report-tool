import { describe, it, expect } from "vitest";
import { modelDisplay, STRUCTURER_MODEL } from "@/lib/domain/modelDisplay";

// Honesty-critical: a "deterministic structurer" is NOT an AI model, and the
// disclosure label it produces must never read as one in a filed report.
describe("modelDisplay", () => {
  it("labels the deterministic structurer as explicitly NOT an AI model", () => {
    const label = modelDisplay(STRUCTURER_MODEL, "1.4.0");
    expect(label).toContain("no AI model used");
    expect(label).toContain("1.4.0");
    expect(label).not.toMatch(/claude|gpt|model\s*\(/i);
  });

  it("labels a real model as 'model (version)'", () => {
    expect(modelDisplay("claude-opus-4-8", "20260101")).toBe("claude-opus-4-8 (20260101)");
  });

  it("STRUCTURER_MODEL is the stable deterministic id the audit chain records", () => {
    expect(STRUCTURER_MODEL).toBe("deterministic-structurer");
  });
});
