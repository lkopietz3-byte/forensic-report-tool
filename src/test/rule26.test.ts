import { describe, expect, it } from "vitest";
import { RULE_26_ELEMENTS, validateRule26 } from "../lib/domain/rule26.js";
import { PLACEHOLDER_TEMPLATE } from "../lib/domain/template.js";
import type { ReportSection, ReportSectionKey } from "../lib/domain/types.js";

function section(
  key: ReportSectionKey,
  over: Partial<ReportSection> = {},
): ReportSection {
  return {
    key,
    title: key,
    draftText: "Some grounded content [[E:e1]].",
    citedEvidenceIds: ["e1"],
    ungroundedFlags: [],
    ...over,
  };
}

/** A report with every Rule 26 element present and non-empty. */
function completeSections(): ReportSection[] {
  return RULE_26_ELEMENTS.map((el) => section(el.key));
}

describe("validateRule26", () => {
  it("passes when all six elements are present and non-empty", () => {
    const r = validateRule26(completeSections(), PLACEHOLDER_TEMPLATE);
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual([]);
  });

  it("flags a missing required element", () => {
    const sections = completeSections().filter((s) => s.key !== "compensation");
    const r = validateRule26(sections, PLACEHOLDER_TEMPLATE);
    expect(r.ok).toBe(false);
    expect(r.issues).toContainEqual(
      expect.objectContaining({ key: "compensation", reason: "missing" }),
    );
  });

  it("flags an empty required element", () => {
    const sections = completeSections().map((s) =>
      s.key === "opinions" ? section("opinions", { draftText: "   " }) : s,
    );
    const r = validateRule26(sections, PLACEHOLDER_TEMPLATE);
    expect(r.ok).toBe(false);
    expect(r.issues).toContainEqual(
      expect.objectContaining({ key: "opinions", reason: "empty" }),
    );
  });

  it("blocks export when an evidence-required section has unresolved ungrounded flags", () => {
    const sections = completeSections().map((s) =>
      s.key === "opinions"
        ? section("opinions", { ungroundedFlags: ["The bridge was unsafe."] })
        : s,
    );
    const r = validateRule26(sections, PLACEHOLDER_TEMPLATE);
    expect(r.ok).toBe(false);
    expect(r.issues).toContainEqual(
      expect.objectContaining({
        key: "opinions",
        reason: "unresolved_ungrounded",
      }),
    );
  });

  it("treats an expert-edited finalText as resolving the ungrounded flags", () => {
    const sections = completeSections().map((s) =>
      s.key === "opinions"
        ? section("opinions", {
            ungroundedFlags: ["The bridge was unsafe."],
            finalText: "Expert-reviewed and corrected text.",
          })
        : s,
    );
    const r = validateRule26(sections, PLACEHOLDER_TEMPLATE);
    expect(r.ok).toBe(true);
  });

  it("can skip the grounding gate when requireGroundingResolved is false", () => {
    const sections = completeSections().map((s) =>
      s.key === "opinions"
        ? section("opinions", { ungroundedFlags: ["Ungrounded."] })
        : s,
    );
    const r = validateRule26(sections, PLACEHOLDER_TEMPLATE, false);
    expect(r.ok).toBe(true);
  });
});
