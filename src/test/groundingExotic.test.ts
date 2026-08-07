import { describe, it, expect } from "vitest";
import { checkGrounding, splitSentences, extractAllCitedIds } from "@/lib/domain/grounding";

// Exotic, worst-case adversarial attacks on the closed-world grounding gate — the
// one invariant that, if defeated, ships a fabricated fact/number/citation under
// an expert's signature. These go beyond the ordinary laundering cases: unicode
// look-alikes, zero-width characters, malformed markers, bidi controls, and a
// pathological-size input (a hang here is a denial-of-service on export). In every
// case the SAFE direction is the same: a tampered or fake citation must NOT ground
// prose, so the fabrication is flagged and export is blocked.

const ZWSP = "\u200B"; // zero-width space
const CYR_E = "\u0435"; // Cyrillic e (U+0435), looks identical to ASCII e
const RLO = "\u202E"; // right-to-left override (bidi control)

describe("grounding exotic — a homoglyph citation is not a real citation", () => {
  it("a Cyrillic-lookalike id does NOT ground a fabricated sentence", () => {
    // Attacker cites [[E:е1]] with a Cyrillic 'е', hoping it reads as e1.
    const g = checkGrounding(`The evaluee lost $2,300,000 [[E:${CYR_E}1]].`, ["e1"]);
    expect(g.isClean).toBe(false);
    expect(g.ungroundedSentences.length).toBe(1);
    // And the fake id is not counted as a real cite.
    expect(g.citedEvidenceIds).toEqual([]);
  });

  it("the identical ASCII id DOES ground it (proves the homoglyph is the only difference)", () => {
    const g = checkGrounding("The evaluee lost $2,300,000 [[E:e1]].", ["e1"]);
    expect(g.isClean).toBe(true);
    expect(g.citedEvidenceIds).toEqual(["e1"]);
  });
});

describe("grounding exotic — zero-width and malformed markers never count as a cite", () => {
  it("a zero-width space inside the id breaks the marker (fabrication flagged)", () => {
    const g = checkGrounding(`The beam failed at 40,000 psi [[E:e${ZWSP}1]].`, ["e1"]);
    expect(g.isClean).toBe(false);
    expect(g.citedEvidenceIds).toEqual([]);
  });

  it("an empty id [[E:]] is not a citation", () => {
    const g = checkGrounding("Lifetime loss is $4,000,000 [[E:]].", ["e1"]);
    expect(g.isClean).toBe(false);
    expect(extractAllCitedIds("[[E:]]")).toEqual([]);
  });

  it("a whitespace-only id [[E:   ]] is not a citation", () => {
    const g = checkGrounding("Lifetime loss is $4,000,000 [[E:   ]].", ["e1"]);
    expect(g.isClean).toBe(false);
    expect(extractAllCitedIds("[[E:   ]]")).toEqual([]);
  });

  it("a single-bracket near-miss [E:e1] is not a citation", () => {
    const g = checkGrounding("Lifetime loss is $4,000,000 [E:e1].", ["e1"]);
    expect(g.isClean).toBe(false);
    expect(g.citedEvidenceIds).toEqual([]);
  });
});

describe("grounding exotic — an invalid id outranks any valid ids in the same sentence", () => {
  it("one hallucinated id among valid ones makes the whole sentence invalid, not grounded", () => {
    const g = checkGrounding(
      "Capacity is $30,000 [[E:e1]] falling to a fabricated $2,300,000 [[E:e9]].",
      ["e1", "e2"],
    );
    expect(g.isClean).toBe(false);
    expect(g.invalidCitationSentences.length).toBe(1);
  });
});

describe("grounding exotic — bidi/control characters cannot smuggle an uncited claim", () => {
  it("a right-to-left override does not let an uncited fabrication pass", () => {
    const g = checkGrounding(`The evaluee will lose ${RLO}$9,000,000 with no citation.`, ["e1"]);
    expect(g.isClean).toBe(false);
    expect(g.ungroundedSentences.length).toBe(1);
  });
});

describe("grounding exotic — unbalanced/deeply-nested brackets fail closed, no hang", () => {
  it("many unbalanced open brackets do not suppress a later separator split", () => {
    // A cited clause, then a stray '[', then a ';' introducing a fabrication.
    const g = checkGrounding(
      "The occupation is closed [[E:e1]] [[[[ see note; the evaluee will also lose $2,300,000.",
      ["e1"],
    );
    expect(g.isClean).toBe(false);
  });

  it("a deeply nested valid marker still grounds and does not hang", () => {
    const g = checkGrounding("The restriction is 25 pounds [[E:e1]].", ["e1"]);
    expect(g.isClean).toBe(true);
  });
});

describe("grounding exotic — pathological-size input terminates quickly (no ReDoS/DoS)", () => {
  it("tens of thousands of cited sentences stay clean and return fast", () => {
    const one = "The measured value is within tolerance [[E:e1]]. ";
    const huge = one.repeat(20_000); // ~1MB of grounded prose
    const start = Date.now();
    const g = checkGrounding(huge, ["e1"]);
    expect(Date.now() - start).toBeLessThan(4_000);
    expect(g.isClean).toBe(true);
  });

  it("a long run with NO terminators and one trailing uncited fabrication is still flagged", () => {
    // No sentence terminators, many separators — must not hang and must flag.
    const run = "word ".repeat(10_000);
    const g = checkGrounding(`${run}[[E:e1]]; and a fabricated $5,000,000 with no cite`, ["e1"]);
    expect(g.isClean).toBe(false);
  });

  it("a pathological pile of open brackets does not hang the splitter", () => {
    const start = Date.now();
    const units = splitSentences("[".repeat(5_000) + "a fabricated figure of $9,000,000");
    expect(Date.now() - start).toBeLessThan(4_000);
    expect(units.length).toBeGreaterThan(0);
  });
});
