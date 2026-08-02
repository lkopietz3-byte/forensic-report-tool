/**
 * exportScaling.test.ts
 *
 * Proves the DOCX and PDF exporters stay robust at scale and on edge inputs.
 * No crashes, valid file magic bytes, non-empty buffers.
 *
 * Performance note: pdfkit is slow (~8s per PDF export). Only 2 PDF test
 * cases here; the rest use the fast DOCX path.
 */
import { describe, expect, it } from "vitest";
import { exportReportDocx } from "../lib/export/docx.js";
import { exportReportPdf } from "../lib/export/pdf.js";
import { DEFAULT_STYLE } from "../lib/export/style.js";
import { generateDisclosureAppendix } from "../lib/domain/disclosure.js";
import { reconstructAllOpinions } from "../lib/domain/reconstruction.js";
import { assessReadiness } from "../lib/domain/readiness.js";
import { AuditLog } from "../lib/domain/audit.js";
import type {
  EvidenceUnit,
  ReportMeta,
  ReportSection,
} from "../lib/domain/types.js";
import type { DisclosureAppendix } from "../lib/domain/disclosure.js";
import type { ReadinessVerdict } from "../lib/domain/readiness.js";

// ─── Fixtures ───────────────────────────────────────────────────────────────

// A valid 1×1 PNG — reused for all figure/logo slots.
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const META: ReportMeta = {
  id: "r-scale",
  caseId: "c-scale",
  discipline: "Structural Engineering",
  templateVersion: "0.0.0-test",
  matter: "Scaling Test v. Robustness Corp.",
  retainingCounsel: "Stress & Partners LLP",
  expertRole: "Structural engineering expert",
};

// 3 evidence units cited across all large sections.
const EVIDENCE: EvidenceUnit[] = [
  { id: "e1", inputId: "i1", content: "Steel sample A failed at 32 ksi.", location: "Lab Report p. 3" },
  { id: "e2", inputId: "i2", content: "Photo shows crack at weld toe.", location: "Photo 7" },
  { id: "e3", inputId: "i3", content: "Inspection log — no prior repairs.", location: "Inspection Log §2" },
];

// 4-paragraph body used for most large sections (cites all 3 evidence IDs).
const MULTI_PARA_BODY =
  "The structural steel failed under the applied load [[E:e1]].\n" +
  "Visual inspection confirmed a crack at the weld toe [[E:e2]].\n" +
  "The inspection log showed no prior remediation on this joint [[E:e3]].\n" +
  "Based on the foregoing, the weld detail was non-conforming [[E:e1]].";

/** Build a 25-section array; some sections vary their bodies slightly. */
function makeLargeSections(count = 25): ReportSection[] {
  return Array.from({ length: count }, (_, i) => ({
    key: `section_${i + 1}`,
    title: `Section ${i + 1} — Topic ${String.fromCharCode(65 + (i % 26))}`,
    draftText: i % 5 === 0
      // Every 5th section: single-sentence body
      ? `This section presents finding ${i + 1} [[E:e${(i % 3) + 1}]].`
      : MULTI_PARA_BODY,
    citedEvidenceIds: ["e1", "e2", "e3"],
    ungroundedFlags: [],
    // Synthetic keys for a scale fixture; the exporters render key as a string,
    // so cast past the strict ReportSectionKey union.
  })) as unknown as ReportSection[];
}

/** 8 figures, all reusing TINY_PNG. */
const EIGHT_FIGURES = Array.from({ length: 8 }, (_, i) => ({
  n: i + 1,
  label: `Figure ${i + 1} — Site photo ${i + 1}`,
  imageData: TINY_PNG,
}));

/** Build a disclosure with all 25 sections logged. */
function makeLargeDisclosure(sections: ReportSection[]): DisclosureAppendix {
  const log = new AuditLog();
  for (const s of sections) {
    log.append({
      reportId: "r-scale",
      sectionKey: s.key,
      prompt: `Draft ${s.title}`,
      model: "claude-sonnet-4-6",
      modelVersion: "2026-05-01",
      inputIds: ["e1", "e2", "e3"],
      output: s.draftText,
    });
  }
  return generateDisclosureAppendix("r-scale", log, EVIDENCE);
}

/** Minimal (1-section, empty-body) fixture. */
const MINIMAL_SECTION: ReportSection[] = [
  {
    key: "scope_of_assignment",
    title: "Introduction",
    draftText: "",
    citedEvidenceIds: [],
    ungroundedFlags: [],
  },
];

function makeMinimalDisclosure(): DisclosureAppendix {
  const log = new AuditLog();
  // No entries — an expert who didn't use AI at all still needs a disclosure record.
  return generateDisclosureAppendix("r-min", log, []);
}

/** Section with a single very long paragraph carrying many citation markers. */
const LONG_CITATION_SECTION: ReportSection[] = [
  {
    key: "opinions",
    title: "Long Opinion with Many Citations",
    // ~120 words, 8 citation markers spread through the paragraph.
    draftText:
      "The steel sample failed at 32 ksi [[E:e1]], well below the design strength of 50 ksi [[E:e2]]. " +
      "The weld at joint J-7 showed lack-of-fusion defects [[E:e3]] consistent with inadequate preheat [[E:e1]]. " +
      "Photographic evidence documents cracking at the weld toe [[E:e2]], and the inspection log confirms " +
      "no prior repairs were performed [[E:e3]]. The failure mode is brittle fracture [[E:e1]], " +
      "which is consistent with the observed crack morphology [[E:e2]] and the absence of ductile " +
      "tearing [[E:e3]]. Within a reasonable degree of engineering certainty, the weld was non-conforming [[E:e1]].",
    citedEvidenceIds: ["e1", "e2", "e3"],
    ungroundedFlags: [],
  },
];

function makeLongCitationDisclosure(): DisclosureAppendix {
  const log = new AuditLog();
  log.append({
    reportId: "r-long",
    sectionKey: "opinions",
    prompt: "Draft the long opinion",
    model: "claude-sonnet-4-6",
    modelVersion: "2026-05-01",
    inputIds: ["e1", "e2", "e3"],
    output: LONG_CITATION_SECTION[0]!.draftText,
  });
  return generateDisclosureAppendix("r-long", log, EVIDENCE);
}

// ─── All-toggles-on style ────────────────────────────────────────────────────
const ALL_ON_STYLE = {
  ...DEFAULT_STYLE,
  font: "times" as const,
  fontSizePt: 12 as const,
  lineSpacing: "double" as const,
  headingNumbering: "roman" as const,
  includeCoverPage: true,
  includeDisclosure: true,
  includeMapping: true,
  includeReadiness: true,
  lineNumbers: true,
  coverLogo: TINY_PNG,
  reportDate: "June 14, 2026",
  footerText: "CONFIDENTIAL",
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("exportScaling — DOCX (fast path)", () => {
  it(
    "large report (25 sections, 8 figures, reconstructions, readiness, all style toggles) exports a valid DOCX",
    async () => {
      const sections = makeLargeSections();
      const disc = makeLargeDisclosure(sections);
      const log = new AuditLog();
      for (const s of sections) {
        log.append({
          reportId: "r-scale",
          sectionKey: s.key,
          prompt: `Draft ${s.title}`,
          model: "claude-sonnet-4-6",
          modelVersion: "2026-05-01",
          inputIds: ["e1", "e2", "e3"],
          output: s.draftText,
        });
      }
      const reconstructions = reconstructAllOpinions("r-scale", sections, log, EVIDENCE);
      // Build a clean Rule26Result inline — no DisciplineTemplate needed.
      const cleanRule26 = { ok: true, issues: [] };
      const readiness: ReadinessVerdict = assessReadiness(cleanRule26, reconstructions);

      const buf = await exportReportDocx({
        meta: META,
        sections,
        disclosure: disc,
        expert: { fullName: "Dr. Alice Smith", credentials: "P.E., Ph.D." },
        reconstructions,
        readiness,
        figures: EIGHT_FIGURES,
        style: ALL_ON_STYLE,
        notice: "SAMPLE — not for filing",
      });

      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(0);
      // DOCX is a ZIP archive; first two bytes are the ZIP magic "PK".
      expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
    },
  );

  it(
    "edge report (single empty-body section, minimal disclosure) produces a valid DOCX",
    async () => {
      const buf = await exportReportDocx({
        meta: { ...META, matter: "Edge Case v. Empty Body" },
        sections: MINIMAL_SECTION,
        disclosure: makeMinimalDisclosure(),
      });

      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(0);
      expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
    },
  );

  it(
    "report with one very long paragraph and many citation markers exports a valid DOCX",
    async () => {
      const buf = await exportReportDocx({
        meta: { ...META, matter: "Long Citation v. Marker Stress" },
        sections: LONG_CITATION_SECTION,
        disclosure: makeLongCitationDisclosure(),
      });

      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(0);
      expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
    },
  );

  it(
    "large report without cover page or disclosure toggles still produces a valid DOCX",
    async () => {
      const sections = makeLargeSections();
      const disc = makeLargeDisclosure(sections);

      const buf = await exportReportDocx({
        meta: META,
        sections,
        disclosure: disc,
        style: {
          ...DEFAULT_STYLE,
          includeCoverPage: false,
          includeDisclosure: false,
          includeMapping: false,
          headingNumbering: "none",
        },
      });

      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(0);
      expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
    },
  );

  it(
    "large report with sans font + 1.5 line spacing produces a valid DOCX",
    async () => {
      const sections = makeLargeSections();
      const disc = makeLargeDisclosure(sections);

      const buf = await exportReportDocx({
        meta: META,
        sections,
        disclosure: disc,
        style: { ...DEFAULT_STYLE, font: "sans", lineSpacing: "onehalf" },
      });

      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(0);
      expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
    },
  );
});

// The full at-scale PDF export is opt-in: pdfkit is slow (~1.5s/page), so it
// would dominate the routine suite. Run it with RUN_SLOW_EXPORT_TESTS=1. The
// always-on DOCX cases above carry the scaling proof; the edge PDF below stays
// on as a fast crash guard.
const RUN_SLOW_EXPORT = !!process.env.RUN_SLOW_EXPORT_TESTS;

describe("exportScaling — PDF (slow path, generous timeout)", () => {
  it.skipIf(!RUN_SLOW_EXPORT)(
    "at-scale report (15 sections, 3 figures, reconstructions, readiness) exports a valid PDF [RUN_SLOW_EXPORT_TESTS]",
    async () => {
      const sections = makeLargeSections(15);
      const disc = makeLargeDisclosure(sections);
      const log = new AuditLog();
      for (const s of sections) {
        log.append({
          reportId: "r-scale",
          sectionKey: s.key,
          prompt: `Draft ${s.title}`,
          model: "claude-sonnet-4-6",
          modelVersion: "2026-05-01",
          inputIds: ["e1", "e2", "e3"],
          output: s.draftText,
        });
      }
      const reconstructions = reconstructAllOpinions("r-scale", sections, log, EVIDENCE);
      const cleanRule26Pdf = { ok: true, issues: [] };
      const readiness: ReadinessVerdict = assessReadiness(cleanRule26Pdf, reconstructions);

      // Use default font (not "times") so Source Serif 4 is used — avoids any
      // WinAnsi glyph boundary issues with the test strings.
      const buf = await exportReportPdf({
        meta: META,
        sections,
        disclosure: disc,
        expert: { fullName: "Dr. Alice Smith", credentials: "P.E., Ph.D." },
        reconstructions,
        readiness,
        figures: EIGHT_FIGURES.slice(0, 3),
        style: {
          ...DEFAULT_STYLE,
          fontSizePt: 12,
          lineSpacing: "double",
          headingNumbering: "roman",
          includeCoverPage: true,
          includeDisclosure: true,
          includeMapping: true,
          includeReadiness: true,
          coverLogo: TINY_PNG,
          reportDate: "June 14, 2026",
          footerText: "CONFIDENTIAL",
        },
        notice: "SAMPLE — not for filing",
      });

      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(0);
      // PDF magic header.
      expect(buf.subarray(0, 4).toString("latin1")).toBe("%PDF");
    },
    120000,
  );

  it(
    "edge report (single empty-body section, minimal disclosure) produces a valid PDF",
    async () => {
      const buf = await exportReportPdf({
        meta: { ...META, matter: "Edge Case v. Empty Body" },
        sections: MINIMAL_SECTION,
        disclosure: makeMinimalDisclosure(),
      });

      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(0);
      expect(buf.subarray(0, 4).toString("latin1")).toBe("%PDF");
    },
    30000,
  );
});
