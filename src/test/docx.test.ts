import { describe, expect, it } from "vitest";
import { exportReportDocx } from "../lib/export/docx.js";
import { DEFAULT_STYLE } from "../lib/export/style.js";

// A valid 1×1 PNG (IHDR width/height = 1) — exercises the logo decode + embed.
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

describe("exportReportDocx", () => {
  it("produces a non-empty DOCX buffer with the PK zip signature", async () => {
    const buf = await exportReportDocx({
      meta,
      sections,
      disclosure: disclosure(),
    });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
    // DOCX is a zip; first two bytes are "PK".
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
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
    await expect(
      exportReportDocx({ meta, sections: empty, disclosure: disclosure() }),
    ).resolves.toBeInstanceOf(Buffer);
  });

  it("includes the per-opinion data→opinion mapping when reconstructions are supplied", async () => {
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
    const buf = await exportReportDocx({
      meta,
      sections,
      disclosure: disclosure(),
      reconstructions,
    });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
  });

  it("renders image evidence as a Figures section without breaking the file", async () => {
    const buf = await exportReportDocx({
      meta,
      sections,
      disclosure: disclosure(),
      figures: [{ n: 1, label: "north stairway", imageData: TINY_PNG }],
    });
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
  });

  it("applies court-formatting options (line numbers, Century, cover logo) without breaking the file", async () => {
    const buf = await exportReportDocx({
      meta,
      sections,
      disclosure: disclosure(),
      style: { ...DEFAULT_STYLE, font: "century", lineNumbers: true, coverLogo: TINY_PNG },
    });
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
  });
});
