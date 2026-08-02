import { describe, expect, it } from "vitest";
import { RULE_26_ELEMENTS, validateRule26 } from "../lib/domain/rule26.js";
import {
  ACCIDENT_RECONSTRUCTION_PREVIEW_TEMPLATE,
  FORENSIC_ENGINEERING_PREVIEW_TEMPLATE,
  VOCREHAB_TEMPLATE,
} from "../lib/domain/template.js";
import type {
  DisciplineTemplate,
  ReportSection,
  ReportSectionKey,
} from "../lib/domain/types.js";

const PROFILE_KEYS: ReportSectionKey[] = [
  "qualifications",
  "prior_testimony",
  "compensation",
];

const RAPEL_KEYS: ReportSectionKey[] = [
  "rehabilitation_plan",
  "transferable_skills",
  "labor_market_survey",
  "earning_capacity",
  "labor_force_participation",
];

describe("VOCREHAB_TEMPLATE", () => {
  it("is still flagged as an unvalidated draft (design-partner gate, Must-Have #2)", () => {
    expect(VOCREHAB_TEMPLATE.version).toContain("draft");
  });

  it("has unique section keys", () => {
    const keys = VOCREHAB_TEMPLATE.sections.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("contains every Rule 26(a)(2)(B) required element", () => {
    const keys = new Set(VOCREHAB_TEMPLATE.sections.map((s) => s.key));
    for (const el of RULE_26_ELEMENTS) {
      expect(keys.has(el.key)).toBe(true);
    }
  });

  it("encodes all five RAPEL components as sections", () => {
    const keys = new Set(VOCREHAB_TEMPLATE.sections.map((s) => s.key));
    for (const k of RAPEL_KEYS) {
      expect(keys.has(k)).toBe(true);
    }
  });

  it("requires evidence grounding for every narrative section but not profile boilerplate", () => {
    for (const s of VOCREHAB_TEMPLATE.sections) {
      if (PROFILE_KEYS.includes(s.key)) {
        expect(s.requiresEvidence).toBe(false);
      } else {
        expect(s.requiresEvidence).toBe(true);
      }
    }
  });

  it("produces a Rule 26-clean result when every required element is drafted and grounded", () => {
    const sections: ReportSection[] = RULE_26_ELEMENTS.map((el) => ({
      key: el.key,
      title: el.key,
      draftText: "Grounded content [[E:e1]].",
      citedEvidenceIds: ["e1"],
      ungroundedFlags: [],
    }));
    const r = validateRule26(sections, VOCREHAB_TEMPLATE);
    expect(r.ok).toBe(true);
  });
});

describe.each([
  ["forensic engineering", FORENSIC_ENGINEERING_PREVIEW_TEMPLATE],
  ["accident reconstruction", ACCIDENT_RECONSTRUCTION_PREVIEW_TEMPLATE],
] as [string, DisciplineTemplate][])("%s preview template", (_label, template) => {
  it("is explicitly versioned as a preview with a named reference", () => {
    expect(template.version).toContain("preview");
    expect(template.standardRef).toBeTruthy();
  });

  it("has unique keys and every Rule 26 required element", () => {
    const keys = template.sections.map((section) => section.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const element of RULE_26_ELEMENTS) {
      expect(keys).toContain(element.key);
    }
  });

  it("keeps every narrative section evidence-grounded", () => {
    for (const section of template.sections) {
      expect(section.instructions.trim().length).toBeGreaterThan(20);
      expect(section.requiresEvidence).toBe(!PROFILE_KEYS.includes(section.key));
    }
  });

  it("includes a private methodology review without pretending it decides validity", () => {
    const prompts = template.sections.flatMap(
      (section) => section.coveragePrompts ?? [],
    );
    expect(prompts.length).toBeGreaterThanOrEqual(6);
    expect(prompts.every((prompt) => prompt.q.endsWith("?"))).toBe(true);
  });
});
