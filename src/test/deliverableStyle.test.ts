import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exportReportDocx } from "../lib/export/docx.js";
import { generateDisclosureAppendix } from "../lib/domain/disclosure.js";
import { AuditLog } from "../lib/domain/audit.js";
import {
  DEFAULT_STYLE,
  normalizeStyle,
  toRoman,
  headingPrefix,
  docxLineTwips,
  pdfLineGap,
} from "../lib/export/style.js";
import type { EvidenceUnit, ReportMeta, ReportSection } from "../lib/domain/types.js";

// Deliverable style options: pure helpers + the DOCX renderer actually applying
// them. Defaults must reproduce the historical output (font/line/numbering).

describe("style helpers", () => {
  it("normalizeStyle merges partials onto defaults", () => {
    expect(normalizeStyle()).toEqual(DEFAULT_STYLE);
    expect(normalizeStyle({ font: "times" }).font).toBe("times");
    expect(normalizeStyle({ font: "times" }).includeDisclosure).toBe(true);
  });

  it("toRoman", () => {
    expect([1, 4, 9, 14, 40].map(toRoman)).toEqual(["I", "IV", "IX", "XIV", "XL"]);
  });

  it("headingPrefix matches the historical decimal format by default", () => {
    expect(headingPrefix(0, DEFAULT_STYLE)).toBe("1.  ");
    expect(headingPrefix(2, normalizeStyle({ headingNumbering: "roman" }))).toBe("III.  ");
    expect(headingPrefix(5, normalizeStyle({ headingNumbering: "none" }))).toBe("");
  });

  it("spacing maps keep the historical values at 'single'", () => {
    expect(docxLineTwips(DEFAULT_STYLE)).toBe(288);
    expect(pdfLineGap(DEFAULT_STYLE)).toBe(3.5);
    expect(docxLineTwips(normalizeStyle({ lineSpacing: "double" }))).toBe(480);
  });
});

// --- DOCX application -------------------------------------------------------

const meta: ReportMeta = {
  id: "r1",
  caseId: "c1",
  discipline: "Forensic Vocational Rehabilitation",
  templateVersion: "0.1.0",
  matter: "Smith v. Acme",
  retainingCounsel: "Doe & Partners",
  expertRole: "Vocational expert",
};

const sections: ReportSection[] = [
  {
    key: "opinions",
    title: "Opinions",
    draftText: "The weld failed under load [[E:e1]].",
    citedEvidenceIds: ["e1"],
    ungroundedFlags: [],
  },
];

const evidence: EvidenceUnit[] = [
  { id: "e1", inputId: "i1", content: "Weld cracked.", location: "Photo 7" },
];

function disclosure() {
  const log = new AuditLog();
  log.append({
    reportId: "r1",
    sectionKey: "opinions",
    prompt: "p",
    model: "m",
    modelVersion: "v",
    inputIds: ["e1"],
    output: "o",
  });
  return generateDisclosureAppendix("r1", log, evidence);
}

// Unzip via the system tool — DOCX is a zip and we don't want a new dependency
// just for tests. `unzip -p file member` streams one member; omitting the
// member streams every file (used for footer XML checks).
const TMP = mkdtempSync(join(tmpdir(), "docx-style-"));
let seq = 0;

function unzipText(buf: Buffer, member?: string): string {
  const file = join(TMP, `t${seq++}.docx`);
  writeFileSync(file, buf);
  const args = member ? ["-p", file, member] : ["-p", file];
  return execFileSync("unzip", args, { maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
}

async function docXml(style?: Parameters<typeof normalizeStyle>[0]) {
  const buf = await exportReportDocx({
    meta,
    sections,
    disclosure: disclosure(),
    style: normalizeStyle(style),
  });
  return unzipText(buf, "word/document.xml");
}

describe("DOCX applies deliverable style", () => {
  it("default style keeps the historical look (Cambria, line 288, '1.' headings, disclosure present)", async () => {
    const xml = await docXml();
    expect(xml).toContain("Cambria");
    expect(xml).toContain('w:line="288"');
    expect(xml).toContain("1.  Opinions");
    expect(xml).toContain("AI-Use Disclosure");
  });

  it("court style: Times New Roman, double spacing, Roman numerals, custom footer, no disclosure appendix", async () => {
    const buf = await exportReportDocx({
      meta,
      sections,
      disclosure: disclosure(),
      style: normalizeStyle({
        font: "times",
        lineSpacing: "double",
        headingNumbering: "roman",
        footerText: "CONFIDENTIAL — DRAFT",
        includeDisclosure: false,
      }),
    });
    const xml = unzipText(buf, "word/document.xml");
    const all = unzipText(buf);
    expect(xml).toContain("Times New Roman");
    expect(xml).toContain('w:line="480"');
    expect(xml).toContain("I.  Opinions");
    expect(xml).not.toContain("AI-Use Disclosure");
    expect(all).toContain("CONFIDENTIAL — DRAFT");
  });

  it("cover can be omitted and a report date shown when included", async () => {
    const withDate = await docXml({ reportDate: "June 10, 2026" });
    expect(withDate).toContain("June 10, 2026");
    const noCover = await docXml({ includeCoverPage: false });
    expect(noCover).not.toContain("Expert Report of"); // cover block gone
  });
});
