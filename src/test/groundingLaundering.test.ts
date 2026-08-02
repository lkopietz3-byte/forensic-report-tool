import { describe, it, expect } from "vitest";
import { checkGrounding, splitSentences } from "@/lib/domain/grounding";

// Adversarial hardening for the grounding splitter. A harsh audit proved a
// fabricated clause could ride a cited clause's marker across ordinary
// punctuation (';', ':', em-dash) and that abbreviation/single-letter fusion let
// "$9M." or "etc." inherit the NEXT sentence's cite. These are the existential
// invariant: a factual clause with no citation must be flagged, never laundered.
// The prior suite only ever split on ASCII periods, so none of this was covered.

const ALLOWED = ["E1", "E2", "E4", "E5", "E7"];

describe("grounding — clause-level laundering is blocked (fail closed)", () => {
  const launders = [
    ["semicolon", "Post-injury earning capacity is $30,000 per year [[E:E2]]; the evaluee will also lose $2,300,000 in future medical costs."],
    ["em-dash", "Post-injury capacity is $30,000 [[E:E2]] — the evaluee will also lose $2,300,000 in future costs."],
    ["colon + capital", "Post-injury capacity is $30,000 [[E:E2]]: The evaluee will also lose $2,300,000 in future costs."],
    ["colon + lowercase", "Post-injury capacity is $30,000 [[E:E2]]: the evaluee will also lose $2,300,000 in fabricated future costs."],
    ["colon glued with no space", "Post-injury capacity is $30,000 [[E:E2]]:The evaluee will also lose $2,300,000 in fabricated costs."],
    ["unbalanced '[' must not suppress the ';' split", "The occupation is closed [[E:E2]] [see; the evaluee will also lose $2,300,000 fabricated."],
    ["$9M. single-letter fusion", "The plaintiff's total demand is $9M. The evaluee was injured on the job [[E:E2]]."],
    ["etc. list-ender fusion", "Records reviewed included depositions, medical files, etc. Lifetime loss is $4,000,000 per my calculation [[E:E2]]."],
    ["non-ASCII full stop (。) with space", "The beam failed under load [[E:E2]]。 The claimant lost $9,000,000 in fabricated damages."],
    ["non-ASCII full stop (。) no space", "The beam failed under load [[E:E2]]。The claimant lost $9,000,000 in fabricated damages。"],
  ] as const;

  for (const [name, text] of launders) {
    it(`flags the uncited clause (${name})`, () => {
      const g = checkGrounding(text, ALLOWED);
      expect(g.isClean, `${name} must NOT export clean`).toBe(false);
      expect(g.ungroundedSentences.length).toBeGreaterThan(0);
    });
  }
});

describe("grounding — legitimate prose is NOT over-split or mis-flagged", () => {
  const clean = [
    ["name initial", "Dana M. Whitfield, M.S., CRC prepared this report [[E:E5]]."],
    ["honorific", "Mr. Alvarez was injured at work [[E:E2]]."],
    ["versus in a caption", "The matter is Alvarez v. Brightline, and the injury is documented [[E:E2]]."],
    ["record cite Tbl.", "The wage figures appear in Tbl. 2 of the survey [[E:E2]]."],
    ["case No.", "Case No. 2025-CV-04417 concerns this injury [[E:E2]]."],
    ["comma-joined, each part cited", "He earns $30,000 per year [[E:E2]], down from $72,000 before the injury [[E:E1]]."],
    ["semicolon, BOTH clauses cited", "The pre-injury occupation is now closed to him [[E:E4]]; sedentary work remains within reach [[E:E7]]."],
    ["colon, BOTH clauses cited", "Two limits apply [[E:E1]]: lifting is capped at 25 pounds [[E:E2]]."],
    ["numeric colon is a ratio, not a clause break", "The lift-to-carry ratio is 3:1 per the evaluation [[E:E2]]."],
    ["numeric colon is a time, not a clause break", "The incident occurred at 9:30 that evening [[E:E2]]."],
  ] as const;

  for (const [name, text] of clean) {
    it(`stays clean (${name})`, () => {
      const g = checkGrounding(text, ALLOWED);
      expect(g.isClean, `${name}: ${JSON.stringify(g.ungroundedSentences)}`).toBe(true);
    });
  }

  it("does not split inside an [Expert input needed: …] placeholder (colon + capital inside brackets)", () => {
    const text = "[Expert input needed: State the worklife reduction and its source].";
    const g = checkGrounding(text, ALLOWED);
    expect(g.isClean).toBe(true);
    expect(g.placeholderSentences.length).toBe(1);
    expect(splitSentences(text)).toHaveLength(1);
  });

  it("keeps a valid marker attached to its clause across a semicolon", () => {
    const units = splitSentences("The occupation is closed [[E:E4]]; sedentary work remains [[E:E7]].");
    expect(units).toHaveLength(2);
    expect(units[0]).toContain("[[E:E4]]");
    expect(units[1]).toContain("[[E:E7]]");
  });
});
