import { describe, expect, it } from "vitest";
import {
  checkGrounding,
  classifySentence,
  splitSentences,
  stripCitationMarkers,
  extractAllCitedIds,
} from "../lib/domain/grounding.js";

// Adversarial hardening for the closed-world grounding contract — the existential
// invariant (a fabricated citation laundered into clean prose under an expert's
// signature). These tests are written to FAIL if any laundering vector reopens.
// They complement grounding.test.ts (the happy-path + core cases) by attacking the
// boundaries: marker syntax, id case-sensitivity, closed-world breaches, and scale.

describe("grounding hardening — citation id is matched exactly (closed-world)", () => {
  it("treats evidence ids as case-sensitive: a cite to E1 is INVALID when only e1 was fed", () => {
    const r = classifySentence("The weld fractured under load [[E:E1]].", ["e1"]);
    // A different-case id is NOT the fed id; it must read as a fabricated cite,
    // never silently accepted.
    expect(r.status).toBe("invalid");
    expect(r.validIds).toEqual([]);
  });

  it("accepts the cite only when the id matches exactly", () => {
    const r = classifySentence("The weld fractured under load [[E:e1]].", ["e1"]);
    expect(r.status).toBe("grounded");
    expect(r.validIds).toEqual(["e1"]);
  });

  it("a cite to an id never fed to the section is invalid, not grounded", () => {
    const r = classifySentence("The claimant cannot return to work [[E:ghost]].", ["e1", "e2"]);
    expect(r.status).toBe("invalid");
  });
});

describe("grounding hardening — only the real [[E:id]] marker syntax counts", () => {
  // A near-miss that LOOKS like a citation must not ground a sentence, or an
  // expert could fabricate the appearance of support with the wrong brackets.
  for (const fake of [
    "The beam buckled [E:e1].", // single brackets
    "The beam buckled (E:e1).", // parentheses
    "The beam buckled [[e1]].", // missing E:
    "The beam buckled [[E e1]].", // missing colon
    "The beam buckled {{E:e1}}.", // braces
  ]) {
    it(`does not accept "${fake.slice(18)}" as a citation`, () => {
      const r = classifySentence(fake, ["e1"]);
      expect(r.status).toBe("ungrounded");
      expect(r.validIds).toEqual([]);
    });
  }

  it("tolerates incidental whitespace inside a real marker", () => {
    const r = classifySentence("The beam buckled [[E:  e1  ]].", ["e1"]);
    expect(r.status).toBe("grounded");
    expect(r.validIds).toEqual(["e1"]);
  });
});

describe("grounding hardening — leading-marker laundering stays closed", () => {
  it("a marker after a terminal period grounds the sentence it FOLLOWS, not the next one", () => {
    // The laundering vector: put a real cite after sentence A's period so the
    // split orphans it onto fabricated sentence B. B must still read ungrounded.
    const text = "The weld cracked under cyclic load [[E:e1]]. The tower then collapsed entirely.";
    const r = checkGrounding(text, ["e1"]);
    expect(r.isClean).toBe(false);
    expect(r.ungroundedSentences).toEqual(["The tower then collapsed entirely."]);
    // e1 is genuinely cited by the first sentence.
    expect(r.citedEvidenceIds).toEqual(["e1"]);
  });

  it("a bare marker between two sentences cannot ground the sentence that follows it", () => {
    const text = "Records were reviewed [[E:e1]]. [[E:e1]] The plaintiff will never work again.";
    const r = checkGrounding(text, ["e1"]);
    // The fabricated final claim must be flagged despite the orphaned marker.
    expect(r.ungroundedSentences).toContain("The plaintiff will never work again.");
  });
});

describe("grounding hardening — a bad cite can never hide behind a placeholder", () => {
  it("invalid citation outranks an explicit placeholder in the same sentence", () => {
    const r = classifySentence(
      "Lost earning capacity is [[E:ghost]] [Expert input needed: present value].",
      ["e1"],
    );
    expect(r.status).toBe("invalid");
  });
});

describe("grounding hardening — closed-world breach is detectable from raw cites", () => {
  it("extractAllCitedIds surfaces ids that were never fed (the broken-contract signature)", () => {
    const text = "Finding A [[E:e1]]. Finding B [[E:ghost]]. Finding C [[E:e2]].";
    // Raw cites, NOT intersected with any allowed set — so a caller can detect a
    // citation to an id outside the closed world.
    expect(extractAllCitedIds(text)).toEqual(["e1", "ghost", "e2"]);
    const r = checkGrounding(text, ["e1", "e2"]);
    expect(r.invalidCitationSentences).toEqual(["Finding B [[E:ghost]]."]);
    expect(r.isClean).toBe(false);
  });
});

describe("grounding hardening — markers never leak across lines", () => {
  it("a cite on one line does not ground a factual sentence on the next line", () => {
    const text = "Records reviewed [[E:e1]].\nThe injury is permanent and total.";
    const r = checkGrounding(text, ["e1"]);
    expect(r.ungroundedSentences).toEqual(["The injury is permanent and total."]);
  });
});

describe("grounding hardening — stripCitationMarkers leaves no ghost cite", () => {
  it("removes every marker and leaves clean punctuation (no residue, no floating space)", () => {
    const out = stripCitationMarkers("The beam failed [[E:e1]]. It buckled [[E:e2]] at the joint.");
    expect(out).not.toMatch(/\[\[E:/);
    expect(out).toBe("The beam failed. It buckled at the joint.");
  });
});

describe("grounding hardening — scales to a large report without breaking", () => {
  it("handles thousands of cited sentences correctly and stays clean", () => {
    const n = 3000;
    const text = Array.from({ length: n }, (_, i) => `Finding number ${i} is supported [[E:e1]].`).join(" ");
    const r = checkGrounding(text, ["e1"]);
    // Correctness at scale is the guard; the test completing within vitest's
    // timeout also proves there is no catastrophic-backtracking regex.
    expect(r.isClean).toBe(true);
    expect(r.citedEvidenceIds).toEqual(["e1"]);
    expect(splitSentences(text).length).toBe(n);
  });
});

describe("grounding hardening — marker adjacency cannot fuse or launder a sentence", () => {
  it("a marker at the very START of the text grounds nothing that follows it", () => {
    const r = checkGrounding("[[E:e1]] The bridge will certainly collapse tomorrow.", ["e1"]);
    expect(r.isClean).toBe(false);
    expect(r.ungroundedSentences).toEqual(["The bridge will certainly collapse tomorrow."]);
  });

  it("a marker opening a new line grounds nothing that follows it", () => {
    const r = checkGrounding(
      "Records were reviewed [[E:e1]].\n[[E:e1]] The claimant will never work again.",
      ["e1"],
    );
    expect(r.ungroundedSentences).toContain("The claimant will never work again.");
  });

  it("a marker glued to a period with no space does not fuse two sentences", () => {
    const r = checkGrounding("Records reviewed.[[E:e1]]The plaintiff cannot work.", ["e1"]);
    expect(r.isClean).toBe(false);
    expect(r.ungroundedSentences).toContain("The plaintiff cannot work.");
  });

  it("a marker before a period glued to the next sentence does not let it ride the cite", () => {
    const r = checkGrounding("The weld failed [[E:e1]].The tower then collapsed entirely.", ["e1"]);
    expect(r.ungroundedSentences).toContain("The tower then collapsed entirely.");
  });

  it("still grounds a normally-cited sentence (no false positive from normalization)", () => {
    const r = checkGrounding("The claimant cannot return to work [[E:e1]].", ["e1"]);
    expect(r.isClean).toBe(true);
    expect(r.citedEvidenceIds).toEqual(["e1"]);
  });
});
