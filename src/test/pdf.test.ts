import { describe, expect, it } from "vitest";
import { exportReportPdf, UnsupportedGlyphError } from "../lib/export/pdf.js";
import { DEFAULT_STYLE } from "../lib/export/style.js";

// A valid 1×1 PNG (IHDR width/height = 1) — exercises the cover-logo embed.
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
import { generateDisclosureAppendix } from "../lib/domain/disclosure.js";
import { reconstructAllOpinions } from "../lib/domain/reconstruction.js";
import { AuditLog } from "../lib/domain/audit.js";
import type {
  EvidenceUnit,
  ReportMeta,
  ReportSection,
} from "../lib/domain/types.js";

const meta: ReportMeta = {
  id: "r1",
  caseId: "c1",
  discipline: "__placeholder__",
  templateVersion: "0.0.0-placeholder",
  matter: "Smith v. Acme",
  retainingCounsel: "Doe & Partners",
  expertRole: "Structural engineering expert",
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
    model: "claude-sonnet-4-6",
    modelVersion: "2026-05-01",
    inputIds: ["e1"],
    output: "The weld failed under load [[E:e1]].",
  });
  return generateDisclosureAppendix("r1", log, evidence);
}

describe("exportReportPdf", () => {
  it("produces a non-empty PDF buffer with the %PDF magic header", async () => {
    const buf = await exportReportPdf({
      meta,
      sections,
      disclosure: disclosure(),
    });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("does not throw when a section body is empty", async () => {
    const empty: ReportSection[] = [
      {
        key: "opinions",
        title: "Opinions",
        draftText: "",
        citedEvidenceIds: [],
        ungroundedFlags: [],
      },
    ];
    const buf = await exportReportPdf({
      meta,
      sections: empty,
      disclosure: disclosure(),
    });
    expect(buf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("includes the per-opinion mapping when reconstructions are supplied", async () => {
    const log = new AuditLog();
    log.append({
      reportId: "r1",
      sectionKey: "opinions",
      prompt: "p",
      model: "claude-sonnet-4-6",
      modelVersion: "2026-05-01",
      inputIds: ["e1"],
      output: "The weld failed under load [[E:e1]].",
    });
    const reconstructions = reconstructAllOpinions("r1", sections, log, evidence);
    const buf = await exportReportPdf({
      meta,
      sections,
      disclosure: disclosure(),
      reconstructions,
      notice: "SAMPLE — not for filing.",
    });
    expect(buf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("allows Cyrillic and accented Latin without flagging (no false positive)", async () => {
    const intl: ReportSection[] = [
      {
        key: "opinions",
        title: "Opinions",
        draftText: "Per Иванов, the café résumé named señor Peña [[E:e1]].",
        citedEvidenceIds: ["e1"],
        ungroundedFlags: [],
      },
    ];
    const buf = await exportReportPdf({
      meta: { ...meta, expertRole: "Inżynier — César Peña" },
      sections: intl,
      disclosure: disclosure(),
    });
    expect(buf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("throws UnsupportedGlyphError when text needs a glyph the font lacks (CJK)", async () => {
    const cjk: ReportSection[] = [
      {
        key: "opinions",
        title: "Opinions",
        draftText: "The seal reads 我是证人 [[E:e1]].",
        citedEvidenceIds: ["e1"],
        ungroundedFlags: [],
      },
    ];
    await expect(
      exportReportPdf({ meta, sections: cjk, disclosure: disclosure() }),
    ).rejects.toBeInstanceOf(UnsupportedGlyphError);
  });

  it("renders image evidence as a Figures section without breaking the file", async () => {
    const buf = await exportReportPdf({
      meta,
      sections,
      disclosure: disclosure(),
      figures: [{ n: 1, label: "north stairway", imageData: TINY_PNG }],
    });
    expect(buf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("applies court-formatting options (Century→Times fallback + cover logo) without breaking the file", async () => {
    const buf = await exportReportPdf({
      meta,
      sections,
      disclosure: disclosure(),
      style: { ...DEFAULT_STYLE, font: "century", lineNumbers: true, coverLogo: TINY_PNG },
    });
    expect(buf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("flags characters outside WinAnsi under the Times style", async () => {
    const cyr: ReportSection[] = [
      {
        key: "opinions",
        title: "Opinions",
        draftText: "Signed Иванов [[E:e1]].",
        citedEvidenceIds: ["e1"],
        ungroundedFlags: [],
      },
    ];
    await expect(
      exportReportPdf({
        meta,
        sections: cyr,
        disclosure: disclosure(),
        style: { ...DEFAULT_STYLE, font: "times" },
      }),
    ).rejects.toBeInstanceOf(UnsupportedGlyphError);
  });
});
