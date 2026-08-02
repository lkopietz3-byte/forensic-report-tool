import { describe, expect, it } from "vitest";
import { buildCoverageChecklist, findLooseEnds } from "@/lib/domain/coverage";
import { VOCREHAB_TEMPLATE } from "@/lib/domain/template";
import type { DisciplineTemplate, EvidenceUnit, ReportSection } from "@/lib/domain/types";

// A tiny template: one analysis section, one index/list section, both require
// evidence; plus a profile section that does not.
const TEMPLATE: DisciplineTemplate = {
  discipline: "test",
  version: "0",
  sections: [
    { key: "analysis", title: "Analysis", instructions: "", rule26Required: false, requiresEvidence: true },
    { key: "records_reviewed", title: "Records Reviewed", instructions: "", rule26Required: false, requiresEvidence: true },
    { key: "compensation", title: "Compensation", instructions: "", rule26Required: true, requiresEvidence: false },
  ],
};

const EVIDENCE: EvidenceUnit[] = [
  { id: "e1", inputId: "i", content: "A", location: "Record A" },
  { id: "e2", inputId: "i", content: "B", location: "Record B" },
  { id: "e3", inputId: "i", content: "C", location: "Record C" },
];

function section(key: string, title: string, draftText: string, cited: string[]): ReportSection {
  return { key: key as ReportSection["key"], title, draftText, citedEvidenceIds: cited, ungroundedFlags: [] };
}

describe("findLooseEnds", () => {
  it("is clean when every record is relied on in an analysis section", () => {
    const r = findLooseEnds({
      sections: [
        section("analysis", "Analysis", "a [[E:e1]] b [[E:e2]] c [[E:e3]]", ["e1", "e2", "e3"]),
        section("records_reviewed", "Records Reviewed", "list", ["e1", "e2", "e3"]),
      ],
      evidence: EVIDENCE,
      template: TEMPLATE,
    });
    expect(r.clear).toBe(true);
    expect(r.inputsAllRelied).toBe(true);
    expect(r.items).toHaveLength(0);
  });

  it("flags a record listed but never relied on in analysis", () => {
    const r = findLooseEnds({
      sections: [
        section("analysis", "Analysis", "a [[E:e1]] b [[E:e2]]", ["e1", "e2"]),
        section("records_reviewed", "Records Reviewed", "list", ["e1", "e2", "e3"]),
      ],
      evidence: EVIDENCE,
      template: TEMPLATE,
    });
    expect(r.inputsAllRelied).toBe(false);
    const item = r.items.find((i) => i.category === "listed_not_relied");
    expect(item?.evidenceIds).toEqual(["e3"]);
    // Neutral question, no substantive content.
    expect(item?.question).toMatch(/Record C/);
    expect(item?.question).toMatch(/intentional/i);
  });

  it("flags evidence confirmed but cited nowhere at all", () => {
    const r = findLooseEnds({
      sections: [section("analysis", "Analysis", "a [[E:e1]]", ["e1"])],
      evidence: EVIDENCE,
      template: TEMPLATE,
    });
    const unused = r.items.filter((i) => i.category === "unused_evidence").map((i) => i.evidenceIds?.[0]);
    expect(unused.sort()).toEqual(["e2", "e3"]);
  });

  it("flags an open '[Expert input needed]' item as a coverage question", () => {
    const r = findLooseEnds({
      sections: [
        section("analysis", "Analysis", "a [[E:e1]] [Expert input needed: the figure]", ["e1"]),
        section("records_reviewed", "Records", "list", ["e2", "e3"]),
      ],
      evidence: EVIDENCE,
      template: TEMPLATE,
    });
    const open = r.items.find((i) => i.category === "open_input");
    expect(open?.sectionKeys).toEqual(["analysis"]);
  });

  it("flags a drafted evidence-section that cites nothing", () => {
    const r = findLooseEnds({
      sections: [section("analysis", "Analysis", "some prose with no citation", [])],
      evidence: [],
      template: TEMPLATE,
    });
    expect(r.items.some((i) => i.category === "uncited_section")).toBe(true);
  });

  it("does not flag the index/list section itself for citing nothing substantive", () => {
    const r = findLooseEnds({
      sections: [section("records_reviewed", "Records Reviewed", "list of records", [])],
      evidence: [],
      template: TEMPLATE,
    });
    // An empty index section is not an "uncited analysis section".
    expect(r.items.some((i) => i.category === "uncited_section")).toBe(false);
  });
});

const CHECKLIST_TEMPLATE: DisciplineTemplate = {
  discipline: "test",
  version: "0",
  sections: [
    {
      key: "analysis",
      title: "Analysis",
      instructions: "",
      rule26Required: false,
      requiresEvidence: true,
      coveragePrompts: [
        { q: "Is work-life expectancy addressed?", mentions: ["work-life"] },
        { q: "Is the claimant's age stated?", mentions: ["years old"] },
        { q: "Is the assignment date given?" }, // no mentions → self-check only
      ],
    },
    { key: "compensation", title: "Compensation", instructions: "", rule26Required: true, requiresEvidence: false },
  ],
};

describe("buildCoverageChecklist", () => {
  it("groups prompts by section and skips sections with none", () => {
    const c = buildCoverageChecklist(CHECKLIST_TEMPLATE);
    expect(c.groups).toHaveLength(1);
    expect(c.groups[0].sectionKey).toBe("analysis");
    expect(c.total).toBe(3);
  });

  it("flags only the questions whose distinctive terms are absent from the report", () => {
    const c = buildCoverageChecklist(
      CHECKLIST_TEMPLATE,
      "The work-life expectancy is deferred to the economist.",
    );
    const q = c.groups[0].questions;
    expect(q[0].detected).toBe(true); // "work-life" present
    expect(q[1].detected).toBe(false); // "years old" absent
    expect(q[2].detected).toBe(null); // no mentions configured
    expect(c.notDetected).toBe(1);
  });

  it("leaves detection null for every prompt when no report text is supplied", () => {
    const c = buildCoverageChecklist(CHECKLIST_TEMPLATE);
    expect(c.groups[0].questions.every((q) => q.detected === null)).toBe(true);
    expect(c.notDetected).toBe(0);
  });
});

// Guardrail: every QUESTION the tool generates — coverage prompts and loose-ends
// — must stay a NEUTRAL question and never originate substance. This is the
// honesty invariant applied to the prompting layer; it fails the build if a
// future prompt plants a figure, a statistic, or an instruction/opinion.
describe("prompt safety (honesty invariant for generated questions)", () => {
  function assertSafe(q: string) {
    expect(q.trim().endsWith("?"), `not a question: ${q}`).toBe(true);
    expect(q, `contains a money figure: ${q}`).not.toMatch(/\$/);
    expect(q, `contains a statistic: ${q}`).not.toMatch(/\d+\s?%/);
    // No substantive suggestion / opinion verbs (asking the expert to confirm or
    // to supply their OWN material is fine; suggesting an answer is not).
    expect(q, `suggests substance: ${q}`).not.toMatch(
      /\b(should|must|recommend|recommended|opine|opines|conclude|concludes|cite [A-Z])\b/i,
    );
  }

  it("every template coverage prompt is a neutral question", () => {
    const prompts = VOCREHAB_TEMPLATE.sections.flatMap((s) => s.coveragePrompts ?? []);
    expect(prompts.length).toBeGreaterThan(10);
    for (const p of prompts) assertSafe(p.q);
  });

  it("every loose-ends question (all four categories) is a neutral question", () => {
    const template: DisciplineTemplate = {
      discipline: "t",
      version: "0",
      sections: [
        { key: "analysis", title: "Analysis", instructions: "", rule26Required: false, requiresEvidence: true },
        { key: "investigation", title: "Investigation", instructions: "", rule26Required: false, requiresEvidence: true },
        { key: "records_reviewed", title: "Records Reviewed", instructions: "", rule26Required: false, requiresEvidence: true },
      ],
    };
    const r = findLooseEnds({
      sections: [
        section("analysis", "Analysis", "a [[E:e1]] [Expert input needed: x]", ["e1"]),
        section("investigation", "Investigation", "prose without a citation", []),
        section("records_reviewed", "Records Reviewed", "list", ["e2"]),
      ],
      evidence: [
        { id: "e1", inputId: "i", content: "A", location: "Record A" },
        { id: "e2", inputId: "i", content: "B", location: "Record B" }, // listed-only
        { id: "e3", inputId: "i", content: "C", location: "Record C" }, // unused
      ],
      template,
    });
    const categories = new Set(r.items.map((i) => i.category));
    expect(categories).toEqual(
      new Set(["open_input", "uncited_section", "listed_not_relied", "unused_evidence"]),
    );
    for (const item of r.items) assertSafe(item.question);
  });
});

import { promises as fsp } from "node:fs";
import { join } from "node:path";

// Ephemeral separation (the make-or-break design rule from the research): the
// coverage check must never be persisted to the audit log or enter the exported
// deliverable, or a "the tool warned you and you proceeded" record becomes
// discoverable. These source-level guards prove the wiring can't drift.
describe("coverage ephemeral separation", () => {
  // Strip comments so a comment that *names* the rule (e.g. "never written to the
  // AuditLog") doesn't read as a violation — we're guarding the actual code.
  const stripComments = (s: string) =>
    s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const code = async (p: string) =>
    stripComments(await fsp.readFile(join(process.cwd(), "src", p), "utf8"));

  it("coverage.ts imports no audit log, disclosure, or persistence", async () => {
    const c = await code("lib/domain/coverage.ts");
    expect(c).not.toMatch(/from\s+["'][^"']*\/audit["']/);
    expect(c).not.toMatch(/from\s+["'][^"']*\/disclosure["']/);
    expect(c).not.toMatch(/supabase/i);
    expect(c).not.toMatch(/\bAuditLog\b/);
  });

  it("the deliverable + moat never import the coverage check", async () => {
    for (const p of ["lib/export/docx.ts", "lib/export/pdf.ts", "lib/domain/disclosure.ts"]) {
      const c = await code(p);
      expect(c, `${p} must not reference coverage`).not.toMatch(/coverage/i);
    }
  });
});

describe("coverage check is pure", () => {
  const sections = [
    section("analysis", "Analysis", "a [[E:e1]]", ["e1"]),
    section("records_reviewed", "Records", "list", ["e1", "e2"]),
  ];
  const evidence: EvidenceUnit[] = [
    { id: "e1", inputId: "i", content: "A", location: "Record A" },
    { id: "e2", inputId: "i", content: "B", location: "Record B" },
  ];

  it("is deterministic and does not mutate its inputs", () => {
    const sBefore = JSON.stringify(sections);
    const eBefore = JSON.stringify(evidence);
    const a = findLooseEnds({ sections, evidence, template: TEMPLATE });
    const b = findLooseEnds({ sections, evidence, template: TEMPLATE });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(sections)).toBe(sBefore);
    expect(JSON.stringify(evidence)).toBe(eBefore);
  });
});
