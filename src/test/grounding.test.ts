import { describe, expect, it } from "vitest";
import {
  checkGrounding,
  classifySentence,
  splitSentences,
  stripCitationMarkers,
} from "../lib/domain/grounding.js";

describe("splitSentences", () => {
  it("splits on sentence punctuation and newlines, trimming empties", () => {
    const out = splitSentences("First fact. Second fact!\n\nThird fact?");
    expect(out).toEqual(["First fact.", "Second fact!", "Third fact?"]);
  });

  it("keeps citation markers attached to their sentence", () => {
    const out = splitSentences("The beam failed [[E:e1]]. It buckled [[E:e2]].");
    expect(out[0]).toContain("[[E:e1]]");
    expect(out[1]).toContain("[[E:e2]]");
  });

  it("does not split on honorifics and keeps the citation on one sentence", () => {
    const out = splitSentences(
      "Mr. Alvarez testified about his work history [[E:e1]].",
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("[[E:e1]]");
  });

  it("does not split on single-letter initials", () => {
    const out = splitSentences("Dana M. Whitfield prepared the analysis [[E:e1]].");
    expect(out).toHaveLength(1);
  });

  it("reattaches a marker orphaned after the terminal period to its sentence", () => {
    // The model sometimes emits the marker AFTER the period; the split would
    // otherwise strand the citation on its own fragment and the sentence would
    // read as ungrounded. The trailing orphan must fold back into its sentence.
    const out = splitSentences("The beam failed. [[E:e1]]");
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("[[E:e1]]");
    // And it counts as grounded once reattached.
    const r = checkGrounding("The beam failed. [[E:e1]]", ["e1"]);
    expect(r.isClean).toBe(true);
    expect(r.ungroundedSentences).toEqual([]);
  });

  it("does NOT let a LEADING marker launder an uncited next sentence (existential)", () => {
    // A marker placed after the previous sentence's period must reattach to that
    // sentence, never ground the fabricated claim that follows it.
    const out = splitSentences("The FCE limits lifting [[E:e1]]. [[E:e1]] The claimant lost $500,000.");
    expect(out).toHaveLength(2);
    expect(out[0]).toContain("[[E:e1]]");
    expect(out[1]).toBe("The claimant lost $500,000."); // no stolen citation
    const r = checkGrounding(
      "The FCE limits lifting [[E:e1]]. [[E:e1]] The claimant lost $500,000.",
      ["e1"],
    );
    expect(r.isClean).toBe(false);
    expect(r.ungroundedSentences).toEqual(["The claimant lost $500,000."]);
  });

  it("grounds the correct sentence when a marker sits between two sentences", () => {
    // "A. [[E:e1]] B." — the marker terminates A, leaving B uncited.
    const r = checkGrounding("The FCE limits lifting. [[E:e1]] The claimant lost $500,000.", ["e1"]);
    expect(r.isClean).toBe(false);
    expect(r.ungroundedSentences).toEqual(["The claimant lost $500,000."]);
    expect(r.citedEvidenceIds).toEqual(["e1"]); // e1 still grounds sentence A
  });
});

describe("checkGrounding", () => {
  it("treats a sentence citing an allowed id as grounded", () => {
    const r = checkGrounding("The weld cracked [[E:e1]].", ["e1"]);
    expect(r.isClean).toBe(true);
    expect(r.citedEvidenceIds).toEqual(["e1"]);
    expect(r.ungroundedSentences).toEqual([]);
    expect(r.invalidCitationSentences).toEqual([]);
  });

  it("flags a factual sentence with no citation as ungrounded", () => {
    const r = checkGrounding("The bridge was unsafe.", ["e1"]);
    expect(r.isClean).toBe(false);
    expect(r.ungroundedSentences).toEqual(["The bridge was unsafe."]);
  });

  it("flags a sentence citing an id outside the fed-in set as a hallucinated cite", () => {
    const r = checkGrounding("Load exceeded spec [[E:e9]].", ["e1"]);
    expect(r.isClean).toBe(false);
    expect(r.invalidCitationSentences).toEqual(["Load exceeded spec [[E:e9]]."]);
    // An invalid id must never be counted as legitimately cited.
    expect(r.citedEvidenceIds).not.toContain("e9");
  });

  it("does not flag explicit expert-input placeholders", () => {
    const r = checkGrounding("[Expert input needed: load rating].", ["e1"]);
    expect(r.isClean).toBe(true);
    expect(r.placeholderSentences).toHaveLength(1);
    expect(r.ungroundedSentences).toEqual([]);
  });

  it("dedupes cited ids and keeps valid ids from a mixed-validity sentence", () => {
    const r = checkGrounding(
      "Both readings agree [[E:e1]] [[E:e1]] [[E:e2]].",
      ["e1", "e2"],
    );
    expect(r.citedEvidenceIds.sort()).toEqual(["e1", "e2"]);
  });

  it("counts a valid id but still flags the sentence when another cite is invalid", () => {
    const r = checkGrounding("Mixed [[E:e1]] and [[E:e9]].", ["e1"]);
    expect(r.invalidCitationSentences).toHaveLength(1);
    expect(r.citedEvidenceIds).toContain("e1");
    expect(r.citedEvidenceIds).not.toContain("e9");
  });

  it("tolerates incidental whitespace inside a marker", () => {
    const r = checkGrounding("The weld cracked [[E: e1 ]].", ["e1"]);
    expect(r.isClean).toBe(true);
    expect(r.citedEvidenceIds).toEqual(["e1"]);
  });

  it("does not let a placeholder hide an invalid citation in the same sentence", () => {
    // A bad cite must never be masked by also carrying an expert-input
    // placeholder — invalid outranks placeholder, or sign-off would let a
    // hallucinated id through.
    const r = checkGrounding(
      "Load exceeded spec [[E:e9]] [Expert input needed: confirm rating].",
      ["e1"],
    );
    expect(r.isClean).toBe(false);
    expect(r.invalidCitationSentences).toHaveLength(1);
    expect(r.placeholderSentences).toHaveLength(0);
  });
});

describe("classifySentence", () => {
  it("classifies a valid citation as grounded", () => {
    const { status, validIds } = classifySentence("Weld cracked [[E:e1]].", ["e1"]);
    expect(status).toBe("grounded");
    expect(validIds).toEqual(["e1"]);
  });

  it("classifies a bare factual sentence as ungrounded", () => {
    expect(classifySentence("The bridge was unsafe.", ["e1"]).status).toBe(
      "ungrounded",
    );
  });

  it("classifies an out-of-set citation as invalid", () => {
    const { status, validIds } = classifySentence("Spec exceeded [[E:e9]].", ["e1"]);
    expect(status).toBe("invalid");
    expect(validIds).toEqual([]);
  });

  it("classifies an expert-input placeholder as placeholder", () => {
    expect(
      classifySentence("[Expert input needed: load rating].", ["e1"]).status,
    ).toBe("placeholder");
  });

  it("ranks invalid above placeholder when a sentence has both", () => {
    expect(
      classifySentence(
        "Spec exceeded [[E:e9]]. [Expert input needed: confirm].",
        ["e1"],
      ).status,
    ).toBe("invalid");
  });

  it("accepts a Set as the allowed-id collection", () => {
    expect(
      classifySentence("Weld cracked [[E:e1]].", new Set(["e1"])).status,
    ).toBe("grounded");
  });
});

describe("stripCitationMarkers", () => {
  it("removes markers and tightens the space left before punctuation", () => {
    expect(stripCitationMarkers("The weld cracked [[E:e1]].")).toBe(
      "The weld cracked.",
    );
  });

  it("collapses whitespace left by mid-sentence markers", () => {
    expect(
      stripCitationMarkers("The analysis [[E:e1]] [[E:e2]], and the survey [[E:e3]] agree."),
    ).toBe("The analysis, and the survey agree.");
  });

  it("leaves prose without markers unchanged", () => {
    expect(stripCitationMarkers("Plain sentence.")).toBe("Plain sentence.");
  });
});
