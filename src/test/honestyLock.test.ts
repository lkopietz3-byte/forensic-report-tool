import { describe, it, expect } from "vitest";
import { AuditLog } from "@/lib/domain/audit";
import { generateDisclosureAppendix } from "@/lib/domain/disclosure";

// Locks the wording of the AI-Disclosure statement — the single most
// legally-sensitive string in the product (it goes into court filings). Any
// edit that drifts toward overclaiming must fail here, not be discovered by
// opposing counsel.

function withAi() {
  const log = new AuditLog();
  log.append({ reportId: "lock", sectionKey: "opinions", prompt: "p", model: "claude-sonnet-4-5", modelVersion: "claude-sonnet-4-5-20250929", inputIds: [], output: "o" });
  return generateDisclosureAppendix("lock", log, []);
}

describe("disclosure statement honesty lock", () => {
  // An empty/no-AI audit yields the no-AI statement.
  const noAi = generateDisclosureAppendix("lock", new AuditLog(), []);

  it("attributes authorship and responsibility to the expert (both modes)", () => {
    for (const s of [noAi.statement, withAi().statement]) {
      expect(s).toContain("expert reviewed, verified, edited, and adopted");
      expect(s).toContain("solely responsible");
    }
  });

  it("states the evidence restriction in plain language, not the term of art", () => {
    expect(noAi.statement).toContain("only the evidence the expert supplied");
    expect(withAi().statement).toContain(
      "restrict the model to the evidence the expert supplied",
    );
    // The jargon term must not appear in the filed statement.
    expect(noAi.statement).not.toMatch(/closed-world/i);
    expect(withAi().statement).not.toMatch(/closed-world/i);
  });

  it("does not imply that a valid citation marker proves substantive support", () => {
    expect(withAi().statement).toMatch(
      /does not independently prove that the source is accurate or supports the sentence/i,
    );
  });

  it("the NO-AI statement does not claim AI assistance that did not happen", () => {
    expect(noAi.statement).toMatch(/no generative AI model produced any text/i);
    expect(noAi.statement).not.toMatch(/assistance of an AI/i);
  });

  it("the AI statement discloses AI assistance", () => {
    expect(withAi().statement).toMatch(/assistance of an AI/i);
  });

  it("never uses banned overclaiming language (both modes)", () => {
    for (const s of [noAi.statement, withAi().statement]) {
      for (const banned of [/tamper-?proof/i, /admissib/i, /court-?defensible/i, /guarantee/i, /compliant/i]) {
        expect(s).not.toMatch(banned);
      }
    }
  });

  it("the integrity note says tamper-EVIDENT semantics, never tamper-proof or hash jargon", () => {
    expect(noAi.integrity.note).not.toMatch(/tamper-?proof/i);
    expect(noAi.integrity.note).not.toMatch(/hash-?chain/i);
  });
});
