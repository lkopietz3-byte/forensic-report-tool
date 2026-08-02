import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LineNumberRestartFormat,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
} from "docx";
import { stripCitationMarkers } from "../domain/grounding";
import { DEFAULT_STYLE, docxLineTwips, headingPrefix } from "./style";
import type { DeliverableStyle } from "./style";
import { modelDisplay } from "../domain/disclosure";
import type { DisclosureAppendix } from "../domain/disclosure.js";
import type { OpinionReconstruction } from "../domain/reconstruction.js";
import type { ReadinessVerdict } from "../domain/readiness.js";
import type { ExhibitTable, ReportMeta, ReportSection } from "../domain/types.js";

// Renders the report + AI-Disclosure Appendix to a premium, court-grade .docx.
// DOCX is the secondary, editable deliverable (PDF is the primary hand-off);
// experts live in Word and revise there, so this must read like a document a
// firm's word-processing desk would produce: a dedicated cover, an updatable
// Table of Contents, Cambria/Calibri typesetting, running header + page-number
// footer, and a real signature block. Citation markers are stripped from
// reader-facing prose; the appendix carries the auditable record.
//
// Closed-world note: the cover renders ONLY supplied data (matter, counsel,
// role, discipline, the expert's own name/credentials). It never invents a
// court, a docket caption, a date, or a signature — the signature line is left
// blank for the expert to sign.

// The deliverable style governing the export currently being built. Set once at
// the top of exportReportDocx. This module-level mutable is race-safe because
// the entire Document construction is synchronous — there is no `await` between
// the assignment and Packer.toBuffer, so two concurrent exports cannot
// interleave during construction.
let ACTIVE: DeliverableStyle = DEFAULT_STYLE;

// Fonts resolve against ACTIVE: "default" keeps the product's Cambria/Calibri
// design; "times" is the court classic (Times New Roman for both roles);
// "sans" sets Calibri everywhere.
function bodyFont(): string {
  if (ACTIVE.font === "times") return "Times New Roman";
  if (ACTIVE.font === "century") return "Century Schoolbook";
  if (ACTIVE.font === "sans") return "Calibri";
  return "Cambria";
}

function headFont(): string {
  if (ACTIVE.font === "times") return "Times New Roman";
  if (ACTIVE.font === "century") return "Century Schoolbook";
  return "Calibri";
}

// Decode the optional cover logo. The client always re-encodes it as PNG, so we
// read the pixel dimensions straight from the IHDR (big-endian uint32 at offsets
// 16/20). Returns null for anything that isn't a well-formed PNG data URL.
function decodeLogo(dataUrl: string): { data: Uint8Array; width: number; height: number } | null {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec((dataUrl ?? "").trim());
  if (!m) return null;
  const data = Uint8Array.from(Buffer.from(m[1]!, "base64"));
  if (data.length < 24) return null;
  const u32 = (o: number) =>
    ((data[o]! << 24) | (data[o + 1]! << 16) | (data[o + 2]! << 8) | data[o + 3]!) >>> 0;
  const width = u32(16);
  const height = u32(20);
  if (!width || !height) return null;
  return { data, width, height };
}

// Centered firm logo at the top of the cover, scaled into a small box. Branding
// only — never evidence, never part of the grounding or disclosure.
function coverLogoParagraphs(): Paragraph[] {
  const logo = ACTIVE.coverLogo ? decodeLogo(ACTIVE.coverLogo) : null;
  if (!logo) return [];
  const maxW = 180;
  const maxH = 72;
  const scale = Math.min(maxW / logo.width, maxH / logo.height, 1);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new ImageRun({
          data: logo.data,
          type: "png",
          transformation: {
            width: Math.max(1, Math.round(logo.width * scale)),
            height: Math.max(1, Math.round(logo.height * scale)),
          },
        }),
      ],
    }),
  ];
}

const INK = "1A1A1A";
const NAVY = "1A2B4A";
const MUTED = "6B7280";
const FAINT = "9AA1AB";
const ALARM = "9F1D1D";
const AMBER = "92400E";
const RULE = "C7CCD1";
const SAMPLE_BG = "FEF3C7";
const SAMPLE_BORDER = "F59E0B";

// US Letter, 1in margins → 6.5in (9360 twip) live measure.
const LETTER = { width: 12240, height: 15840 };
const MARGIN_TWIP = 1440;
const PAGE_CONTENT_TWIP = 9360;

type Expert = { fullName: string; credentials?: string };

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;

// "scope_of_assignment" → "Scope of assignment".
function humanizeKey(key: string): string {
  const s = key.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// A clean two-column Word table: bold left label (with optional muted subline)
// and a wrapped right cell, hairline row dividers, navy header underline. Native
// Word tables render reliably and read as court-grade — far better than the
// run-on paragraph list the disclosure used before.
const TABLE_LEFT_TWIP = 3200;
const TABLE_RIGHT_TWIP = PAGE_CONTENT_TWIP - TABLE_LEFT_TWIP;

function tableHeaderCell(text: string): TableCell {
  return new TableCell({
    borders: { top: NO_BORDER, left: NO_BORDER, right: NO_BORDER, bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY } },
    margins: { top: 40, bottom: 60, left: 0, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text: text.toUpperCase(), font: headFont(), size: 15, bold: true, color: MUTED, characterSpacing: 16 })],
      }),
    ],
  });
}

function twoColTable(
  headers: [string, string],
  rows: { title: string; sub?: string; right: string; rightColor?: string }[],
): Table {
  const hairline = { style: BorderStyle.SINGLE, size: 2, color: RULE } as const;
  return new Table({
    width: { size: PAGE_CONTENT_TWIP, type: WidthType.DXA },
    columnWidths: [TABLE_LEFT_TWIP, TABLE_RIGHT_TWIP],
    borders: { top: NO_BORDER, left: NO_BORDER, right: NO_BORDER, bottom: NO_BORDER, insideVertical: NO_BORDER, insideHorizontal: hairline },
    rows: [
      new TableRow({ tableHeader: true, children: [tableHeaderCell(headers[0]), tableHeaderCell(headers[1])] }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: TABLE_LEFT_TWIP, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 0, right: 160 },
                children: [
                  new Paragraph({
                    spacing: { after: row.sub ? 20 : 0 },
                    children: [new TextRun({ text: row.title, font: bodyFont(), size: 21, bold: true, color: INK })],
                  }),
                  ...(row.sub
                    ? [new Paragraph({ children: [new TextRun({ text: row.sub, font: headFont(), size: 16, color: MUTED })] })]
                    : []),
                ],
              }),
              new TableCell({
                width: { size: TABLE_RIGHT_TWIP, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 0, right: 0 },
                children: [
                  new Paragraph({
                    spacing: { line: 264 },
                    children: [new TextRun({ text: row.right, font: bodyFont(), size: 21, color: row.rightColor ?? INK })],
                  }),
                ],
              }),
            ],
          }),
      ),
    ],
  });
}

// ─── Exhibit data tables (multi-column) ─────────────────────────────────────
// A generic N-column table for attached exhibits (labor-market survey, TSA,
// earning-capacity comparison). Header underlined in navy; hairline row
// dividers; equal columns unless the exhibit supplies colFractions.
function exhibitDataTable(ex: ExhibitTable): Table {
  const n = ex.columns.length;
  const fractions =
    ex.colFractions && ex.colFractions.length === n
      ? ex.colFractions
      : Array(n).fill(1 / n);
  const widths = fractions.map((f) => Math.round(PAGE_CONTENT_TWIP * f));
  const hairline = { style: BorderStyle.SINGLE, size: 2, color: RULE } as const;

  const headerRow = new TableRow({
    tableHeader: true,
    children: ex.columns.map(
      (c, i) =>
        new TableCell({
          width: { size: widths[i], type: WidthType.DXA },
          borders: { top: NO_BORDER, left: NO_BORDER, right: NO_BORDER, bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY } },
          margins: { top: 40, bottom: 60, left: 0, right: 100 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: c.toUpperCase(), font: headFont(), size: 14, bold: true, color: MUTED, characterSpacing: 8 })],
            }),
          ],
        }),
    ),
  });

  const bodyRows = ex.rows.map(
    (row) =>
      new TableRow({
        children: ex.columns.map(
          (_, i) =>
            new TableCell({
              width: { size: widths[i], type: WidthType.DXA },
              margins: { top: 60, bottom: 60, left: 0, right: 100 },
              children: [
                new Paragraph({
                  spacing: { line: 248 },
                  children: [new TextRun({ text: row[i] ?? "", font: bodyFont(), size: 18, color: INK })],
                }),
              ],
            }),
        ),
      }),
  );

  return new Table({
    width: { size: PAGE_CONTENT_TWIP, type: WidthType.DXA },
    columnWidths: widths,
    borders: { top: NO_BORDER, left: NO_BORDER, right: NO_BORDER, bottom: NO_BORDER, insideVertical: NO_BORDER, insideHorizontal: hairline },
    rows: [headerRow, ...bodyRows],
  });
}

// Image evidence rendered as numbered figures (its own section, like Exhibits).
// The images are case material the expert supplied; they are cited by id in the
// body like any evidence and appear in the disclosure — this just renders them.
function figuresChildren(figures: { n: number; label: string; imageData: string }[]): Paragraph[] {
  if (figures.length === 0) return [];
  const out: Paragraph[] = [
    new Paragraph({
      pageBreakBefore: true,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 4 } },
      children: [new TextRun({ text: "Figures", font: headFont(), size: 32, bold: true, color: NAVY })],
    }),
  ];
  for (const fig of figures) {
    const img = decodeLogo(fig.imageData);
    if (img) {
      const scale = Math.min(432 / img.width, 396 / img.height, 1);
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { before: 200, after: 40 },
          children: [
            new ImageRun({
              data: img.data,
              type: "png",
              transformation: {
                width: Math.max(1, Math.round(img.width * scale)),
                height: Math.max(1, Math.round(img.height * scale)),
              },
            }),
          ],
        }),
      );
    }
    out.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 },
        children: [
          new TextRun({ text: `Figure ${fig.n} — ${fig.label}`, font: bodyFont(), size: 18, italics: true, color: MUTED }),
        ],
      }),
    );
  }
  return out;
}

function exhibitsChildren(exhibits: ExhibitTable[]): (Paragraph | Table)[] {
  if (exhibits.length === 0) return [];
  const out: (Paragraph | Table)[] = [
    new Paragraph({
      pageBreakBefore: true,
      spacing: { after: 60 },
      children: [new TextRun({ text: "ATTACHMENTS", font: headFont(), size: 17, bold: true, color: MUTED, characterSpacing: 28 })],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      keepNext: true,
      spacing: { after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 4 } },
      children: [new TextRun({ text: "Exhibits", font: headFont(), size: 32, bold: true, color: NAVY })],
    }),
  ];
  for (const ex of exhibits) {
    out.push(
      new Paragraph({
        keepNext: true,
        spacing: { before: 240, after: 20 },
        children: [
          new TextRun({ text: `${ex.label} — `, font: headFont(), size: 21, bold: true, color: NAVY }),
          new TextRun({ text: ex.title, font: headFont(), size: 21, bold: true, color: INK }),
        ],
      }),
    );
    if (ex.caption) {
      out.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: ex.caption, font: bodyFont(), size: 18, italics: true, color: MUTED })],
        }),
      );
    }
    out.push(exhibitDataTable(ex));
    if (ex.footnote) {
      out.push(
        new Paragraph({
          spacing: { before: 60, after: 0 },
          children: [new TextRun({ text: ex.footnote, font: headFont(), size: 15, color: FAINT })],
        }),
      );
    }
  }
  return out;
}

// ─── Body + heading primitives ──────────────────────────────────────────────
// "[Expert input needed: …]" open-item marker. Styled distinctly wherever it
// appears so it can never read as the expert's own opinion prose.
const OPEN_ITEM_RE = /\[Expert input needed:[^\]]*\]/gi;

function bodyRuns(line: string): TextRun[] {
  const size = ACTIVE.fontSizePt * 2;
  const runs: TextRun[] = [];
  let last = 0;
  for (const m of line.matchAll(OPEN_ITEM_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) runs.push(new TextRun({ text: line.slice(last, idx), font: bodyFont(), size, color: INK }));
    runs.push(new TextRun({ text: m[0], font: bodyFont(), size, bold: true, color: AMBER }));
    last = idx + m[0].length;
  }
  if (last < line.length || runs.length === 0) {
    runs.push(new TextRun({ text: line.slice(last), font: bodyFont(), size, color: INK }));
  }
  return runs;
}

function bodyPara(line: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: docxLineTwips(ACTIVE) },
    children: bodyRuns(line),
  });
}

// A prominent stamp placed at the top of the body whenever the report still
// carries open "[Expert input needed]" items — so a working draft can never be
// mistaken for a final, signable deliverable.
function draftBanner(count: number): Paragraph {
  const box = { style: BorderStyle.SINGLE, size: 12, color: AMBER, space: 6 } as const;
  return new Paragraph({
    spacing: { after: 240 },
    border: { top: box, bottom: box, left: box, right: box },
    children: [
      new TextRun({ text: "DRAFT — INCOMPLETE, NOT FOR FILING.  ", font: headFont(), size: 22, bold: true, color: ALARM }),
      new TextRun({
        text: `This report still contains ${count} item${count === 1 ? "" : "s"} marked “[Expert input needed]” for the expert to complete before signing.`,
        font: bodyFont(),
        size: 20,
        color: INK,
      }),
    ],
  });
}

// Top-level section title — styled Heading1 so the Table of Contents collects it.
function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    keepNext: true,
    spacing: { before: 300, after: 140 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 4 } },
    children: [new TextRun({ text, font: headFont(), size: ACTIVE.fontSizePt * 2 + 4, bold: true, color: NAVY })],
  });
}

function eyebrow(text: string, color = MUTED): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: headFont(),
        size: 17,
        bold: true,
        color,
        characterSpacing: 28,
      }),
    ],
  });
}

function subHeading(text: string): Paragraph {
  return new Paragraph({
    keepNext: true,
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, font: headFont(), size: 21, bold: true, color: NAVY })],
  });
}

function labelValue(label: string, value: string, valueColor = INK): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label} `, font: headFont(), size: 20, bold: true, color: INK }),
      new TextRun({ text: value, font: bodyFont(), size: ACTIVE.fontSizePt * 2, color: valueColor }),
    ],
  });
}

function centered(
  text: string,
  opts: { font: string; size: number; color: string; bold?: boolean; italics?: boolean; tracking?: number; after?: number },
): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: opts.after ?? 80 },
    children: [
      new TextRun({
        text,
        font: opts.font,
        size: opts.size,
        bold: opts.bold,
        italics: opts.italics,
        color: opts.color,
        characterSpacing: opts.tracking,
      }),
    ],
  });
}

function rule(color = RULE, size = 6, after = 160): Paragraph {
  return new Paragraph({
    spacing: { before: 40, after },
    border: { bottom: { style: BorderStyle.SINGLE, size, color, space: 4 } },
    children: [new TextRun({ text: "", size: 2 })],
  });
}

// ─── Cover page (its own section: no header/footer) ─────────────────────────
function coverChildren(meta: ReportMeta, expert?: Expert, notice?: string): Paragraph[] {
  const out: Paragraph[] = [];

  out.push(...coverLogoParagraphs());

  if (notice) {
    out.push(
      new Paragraph({
        shading: { fill: SAMPLE_BG },
        spacing: { after: 240 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: SAMPLE_BORDER, space: 6 },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: SAMPLE_BORDER, space: 6 },
          left: { style: BorderStyle.SINGLE, size: 6, color: SAMPLE_BORDER, space: 6 },
          right: { style: BorderStyle.SINGLE, size: 6, color: SAMPLE_BORDER, space: 6 },
        },
        children: [new TextRun({ text: notice, font: headFont(), size: 18, bold: true, color: AMBER })],
      }),
    );
  }

  // Push the title block into the upper third (less when a logo already sits at top).
  const topGap = ACTIVE.coverLogo ? (notice ? 700 : 1400) : notice ? 1800 : 2600;
  out.push(new Paragraph({ spacing: { before: topGap }, children: [] }));

  out.push(centered("Fed. R. Civ. P. 26(a)(2)(B)", { font: headFont(), size: 18, bold: true, color: NAVY, tracking: 44, after: 140 }));
  out.push(rule(NAVY, 8, 220));

  if (expert?.fullName) {
    out.push(centered("Expert Report of", { font: headFont(), size: 21, bold: true, color: MUTED, tracking: 40, after: 120 }));
    out.push(centered(expert.fullName, { font: bodyFont(), size: 46, bold: true, color: NAVY, after: 120 }));
  } else {
    out.push(centered("Expert Report", { font: bodyFont(), size: 52, bold: true, color: NAVY, after: 120 }));
  }
  out.push(centered(meta.expertRole, { font: bodyFont(), size: 26, italics: true, color: INK, after: 260 }));

  out.push(rule(RULE, 6, 220));
  out.push(centered(meta.matter, { font: bodyFont(), size: 27, bold: true, color: INK, after: 140 }));
  out.push(centered(`Retained by ${meta.retainingCounsel}`, { font: bodyFont(), size: 22, color: MUTED, after: 60 }));
  out.push(centered(meta.discipline, { font: bodyFont(), size: 22, color: MUTED, after: 60 }));
  if (ACTIVE.reportDate.trim()) {
    out.push(centered(ACTIVE.reportDate.trim(), { font: bodyFont(), size: 22, color: INK, after: 60 }));
  }

  out.push(new Paragraph({ spacing: { before: 2200 }, children: [] }));
  out.push(
    centered("DRAFT — NOT SIGNED", {
      font: headFont(),
      size: 16,
      bold: true,
      color: FAINT,
      tracking: 26,
      after: 0,
    }),
  );

  return out;
}

// ─── Report sections ────────────────────────────────────────────────────────
function sectionParagraphs(section: ReportSection, index: number): Paragraph[] {
  const text = stripCitationMarkers(section.finalText ?? section.draftText);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return [
    heading(headingPrefix(index, ACTIVE) + section.title),
    ...(lines.length
      ? lines.map(bodyPara)
      : [
          new Paragraph({
            children: [new TextRun({ text: "(no content)", italics: true, font: bodyFont(), size: 22, color: MUTED })],
          }),
        ]),
  ];
}

// ─── Certification / signature block ────────────────────────────────────────
function signatureLine(width: number): Table {
  return new Table({
    width: { size: width, type: WidthType.DXA },
    // Without an explicit column/cell width, Word collapses this single-cell
    // table to a ~100-twip stub and the signature underline renders stunted.
    columnWidths: [width],
    borders: {
      top: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      insideHorizontal: NO_BORDER,
      insideVertical: NO_BORDER,
      bottom: { style: BorderStyle.SINGLE, size: 6, color: INK },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: width, type: WidthType.DXA },
            borders: { top: NO_BORDER, left: NO_BORDER, right: NO_BORDER, bottom: { style: BorderStyle.SINGLE, size: 6, color: INK } },
            children: [new Paragraph({ spacing: { before: 360 }, children: [] })],
          }),
        ],
      }),
    ],
  });
}

function certificationChildren(meta: ReportMeta, expert?: Expert): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [
    heading("Certification of the Expert"),
    bodyPara(
      `I prepared this report in my capacity as ${meta.expertRole}. The opinions stated are my own ` +
        "and rest on the materials identified in this report. I reviewed and adopted the report and " +
        "remain responsible for every fact and opinion stated herein.",
    ),
    new Paragraph({ spacing: { before: 240 }, children: [] }),
    signatureLine(5040),
    new Paragraph({
      spacing: { before: 60, after: 0 },
      children: [new TextRun({ text: expert?.fullName ?? meta.expertRole, font: bodyFont(), size: 22, bold: true, color: INK })],
    }),
  ];
  if (expert?.credentials) {
    out.push(
      new Paragraph({
        spacing: { after: 0 },
        children: [new TextRun({ text: expert.credentials, font: bodyFont(), size: 19, color: MUTED })],
      }),
    );
  }
  out.push(
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    new Paragraph({
      children: [
        new TextRun({ text: "Date:  ", font: headFont(), size: 20, bold: true, color: INK }),
        new TextRun({ text: "______________________________", font: bodyFont(), size: 22, color: MUTED }),
      ],
    }),
  );
  return out;
}

// ─── AI-Use Disclosure appendix ─────────────────────────────────────────────
function appendixParagraphs(appendix: DisclosureAppendix, titleOf: (key: string) => string): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [
    new Paragraph({ pageBreakBefore: true, spacing: { after: 60 }, children: [new TextRun({ text: "APPENDIX", font: headFont(), size: 17, bold: true, color: MUTED, characterSpacing: 28 })] }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      keepNext: true,
      spacing: { after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 4 } },
      children: [new TextRun({ text: "AI-Use Disclosure", font: headFont(), size: 32, bold: true, color: NAVY })],
    }),
    bodyPara(appendix.statement),
    subHeading("Tools and models used"),
  ];

  for (const m of appendix.models) {
    out.push(
      new Paragraph({
        spacing: { after: 40 },
        indent: { left: 160 },
        children: [new TextRun({ text: `•  ${m}`, font: bodyFont(), size: 22, color: INK })],
      }),
    );
  }

  out.push(
    subHeading("AI-assisted sections"),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text:
            "Each report section the tool helped structure, the model that assisted it, and the " +
            "evidence the expert provided to the tool for that section.",
          font: bodyFont(),
          size: 19,
          italics: true,
          color: MUTED,
        }),
      ],
    }),
    twoColTable(
      ["Section", "Evidence provided to the tool"],
      appendix.entries.map((entry) => ({
        title: titleOf(entry.sectionKey),
        sub: modelDisplay(entry.model, entry.modelVersion),
        right: entry.evidenceSources.length
          ? entry.evidenceSources.map((s) => s.location).join("; ")
          : "(none provided)",
      })),
    ),
  );

  out.push(
    subHeading("Record integrity"),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: appendix.integrity.note,
          font: bodyFont(),
          size: 21,
          color: appendix.integrity.verified ? INK : ALARM,
        }),
      ],
    }),
  );

  return out;
}

// Composed pre-export readiness check. A verification summary, not a legal
// opinion: it reports the tool's internal-consistency checks (Rule 26
// completeness, closed-world grounding, audit-chain integrity) as blockers vs.
// open expert items. Admissibility remains the court's determination.
function readinessParagraphs(readiness: ReadinessVerdict): Paragraph[] {
  const headColor = readiness.blockers > 0 ? ALARM : readiness.warnings > 0 ? AMBER : NAVY;
  const out: Paragraph[] = [
    heading("Report readiness check"),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: readiness.headline, font: bodyFont(), size: 23, bold: true, color: headColor })],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text:
            "Automated internal checks — completeness, every sentence cited to the evidence, " +
            "and disclosure-record integrity. Not a determination of admissibility, which is the court's.",
          font: bodyFont(),
          size: 19,
          italics: true,
          color: MUTED,
        }),
      ],
    }),
  ];

  if (readiness.findings.length === 0) {
    out.push(bodyPara("No open findings."));
    return out;
  }

  for (const f of readiness.findings) {
    const isBlocker = f.severity === "blocker";
    out.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: isBlocker ? "BLOCKER  " : "OPEN ITEM  ",
            font: headFont(),
            size: 18,
            bold: true,
            color: isBlocker ? ALARM : AMBER,
          }),
          new TextRun({ text: f.message, font: bodyFont(), size: 22, color: INK }),
        ],
      }),
    );
  }

  return out;
}

// Per-opinion data→opinion mapping: the "challenge view" an expert can hand to
// opposing counsel. For each AI-assisted opinion it shows, separately, the
// evidence the SIGNED text actually cites (relied on) versus evidence merely
// provided to the tool (considered), and raises an explicit alarm if the signed
// text cites anything never provided — which the closed-world contract forbids.
function reconstructionParagraphs(reconstructions: OpinionReconstruction[], titleOf: (key: string) => string): Paragraph[] {
  const aiAssisted = reconstructions.filter((r) => r.aiAssisted);
  if (aiAssisted.length === 0) return [];

  const out: Paragraph[] = [
    heading("Data-to-opinion mapping (for a challenged opinion)"),
    bodyPara(
      "For each AI-assisted opinion, the evidence the signed text relies on is listed separately " +
        "from evidence that was provided but not cited. The tool cannot cite any material it " +
        "was not given, so every citation in this report resolves to a source the expert supplied.",
    ),
  ];

  for (const r of aiAssisted) {
    out.push(
      new Paragraph({
        keepNext: true,
        spacing: { before: 140, after: 40 },
        children: [new TextRun({ text: titleOf(r.sectionKey), font: headFont(), size: 20, bold: true, color: NAVY })],
      }),
    );
    const reliedOn = r.reliedOn.length ? r.reliedOn.map((s) => s.location).join("; ") : "(none cited)";
    const considered = r.fedButNotReliedOn.length ? r.fedButNotReliedOn.map((s) => s.location).join("; ") : "(none)";
    out.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({ text: "Relied on (cited in the signed opinion): ", font: headFont(), size: 20, bold: true, color: INK }),
          new TextRun({ text: reliedOn, font: bodyFont(), size: 22, color: INK }),
        ],
      }),
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: "Also considered (provided, not cited): ", font: headFont(), size: 20, bold: true, color: INK }),
          new TextRun({ text: considered, font: bodyFont(), size: 22, color: INK }),
        ],
      }),
    );
    if (r.reliedOnButNeverFed.length > 0) {
      out.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `INTEGRITY ALARM — this opinion cites evidence that was never provided to the tool: ${r.reliedOnButNeverFed.join(", ")}. Resolve before signing.`,
              font: headFont(),
              size: 20,
              bold: true,
              color: ALARM,
            }),
          ],
        }),
      );
    }
  }

  return out;
}

// ─── Running header + page-number footer (body section only) ────────────────
function bodyHeader(meta: ReportMeta): Header {
  return new Header({
    children: [
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: PAGE_CONTENT_TWIP }],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 } },
        children: [
          new TextRun({ text: meta.matter, font: headFont(), size: 15, color: FAINT }),
          new TextRun({ text: "\t", font: headFont(), size: 15, color: FAINT }),
          new TextRun({ text: "EXPERT REPORT", font: headFont(), size: 15, bold: true, color: FAINT, characterSpacing: 20 }),
        ],
      }),
    ],
  });
}

function bodyFooter(note: string): Footer {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 6 } },
        tabStops: [{ type: TabStopType.RIGHT, position: PAGE_CONTENT_TWIP }],
        children: [
          new TextRun({ text: note, font: headFont(), size: 16, color: MUTED }),
          new TextRun({ text: "\t", font: headFont(), size: 16, color: MUTED }),
          new TextRun({ text: "Page ", font: headFont(), size: 16, color: MUTED }),
          new TextRun({ children: [PageNumber.CURRENT], font: headFont(), size: 16, color: MUTED }),
          new TextRun({ text: " of ", font: headFont(), size: 16, color: MUTED }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: headFont(), size: 16, color: MUTED }),
        ],
      }),
    ],
  });
}

function tableOfContents(): (Paragraph | TableOfContents)[] {
  return [
    eyebrow("Contents"),
    new Paragraph({
      spacing: { after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 4 } },
      children: [new TextRun({ text: "Table of Contents", font: headFont(), size: 32, bold: true, color: NAVY })],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: "If entries do not appear, right-click below and choose “Update Field”.",
          font: bodyFont(),
          size: 17,
          italics: true,
          color: MUTED,
        }),
      ],
    }),
    // Real Word TOC field collecting Heading1 paragraphs. features.updateFields
    // (below) makes Word repaginate it on open so page numbers are correct.
    new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-1" }),
  ];
}

export async function exportReportDocx(args: {
  meta: ReportMeta;
  sections: ReportSection[];
  disclosure: DisclosureAppendix;
  /** The expert's own name/credentials — drives the cover title and signature. */
  expert?: Expert;
  /** Optional per-opinion data→opinion mapping appended after the disclosure. */
  reconstructions?: OpinionReconstruction[];
  /** Optional composed readiness check rendered before the disclosure appendix. */
  readiness?: ReadinessVerdict;
  /** Optional tabular exhibits attached after the certification. */
  exhibits?: ExhibitTable[];
  /** Optional image figures (from image evidence) rendered before the exhibits. */
  figures?: { n: number; label: string; imageData: string }[];
  /** Optional banner rendered on the cover — e.g. a "sample, not for filing" notice. */
  notice?: string;
  /** Deliverable formatting options; omitted = DEFAULT_STYLE = historical output. */
  style?: DeliverableStyle;
}): Promise<Buffer> {
  // Pin the style for this export. Safe despite being module-level state:
  // everything from here through `new Document(...)` is synchronous (the first
  // `await` is Packer.toBuffer), so concurrent exports cannot interleave while
  // the Document is being constructed.
  ACTIVE = args.style ?? DEFAULT_STYLE;

  // Resolve section keys to the report's actual headings so the appendices name
  // sections exactly as the body does (auditable), falling back to a humanized
  // key for anything not in the report.
  const titleOf = (key: string): string =>
    args.sections.find((s) => s.key === key)?.title ?? humanizeKey(key);
  const openItemCount = args.sections.reduce(
    (n, s) => n + ((s.finalText ?? s.draftText).match(OPEN_ITEM_RE)?.length ?? 0),
    0,
  );

  const footerNote =
    ACTIVE.footerText.trim() ||
    (args.notice
      ? "SAMPLE — not for filing"
      : "DRAFT — NOT SIGNED");

  const pageProps = {
    page: {
      size: { width: LETTER.width, height: LETTER.height },
      margin: { top: MARGIN_TWIP, bottom: MARGIN_TWIP, left: MARGIN_TWIP, right: MARGIN_TWIP },
    },
  };

  const doc = new Document({
    creator: args.expert?.fullName ?? args.meta.expertRole,
    title: `Expert Report — ${args.meta.matter}`,
    description: "Fed. R. Civ. P. 26(a)(2)(B) Expert Report",
    features: { updateFields: true },
    styles: {
      default: {
        document: { run: { font: bodyFont(), size: ACTIVE.fontSizePt * 2, color: INK } },
        heading1: { run: { font: headFont(), size: ACTIVE.fontSizePt * 2 + 4, bold: true, color: NAVY }, paragraph: { spacing: { before: 300, after: 140 } } },
      },
    },
    sections: [
      // Section 1 — cover. No header/footer. Omitted entirely when the style
      // says so; the body section below is self-contained.
      ...(ACTIVE.includeCoverPage
        ? [
            {
              properties: pageProps,
              children: coverChildren(args.meta, args.expert, args.notice),
            },
          ]
        : []),
      // Section 2 — body. Running header + page-number footer. Optional court
      // pleading-paper line numbering (continuous) on the filed Word master.
      {
        properties: {
          ...pageProps,
          ...(ACTIVE.lineNumbers
            ? { lineNumbers: { countBy: 1, restart: LineNumberRestartFormat.CONTINUOUS } }
            : {}),
        },
        headers: { default: bodyHeader(args.meta) },
        footers: { default: bodyFooter(footerNote) },
        children: [
          ...(openItemCount > 0 ? [draftBanner(openItemCount)] : []),
          ...tableOfContents(),
          ...args.sections.flatMap((s, i) => sectionParagraphs(s, i)),
          ...certificationChildren(args.meta, args.expert),
          ...(args.figures ? figuresChildren(args.figures) : []),
          ...(args.exhibits ? exhibitsChildren(args.exhibits) : []),
          ...(ACTIVE.includeDisclosure ? appendixParagraphs(args.disclosure, titleOf) : []),
          ...(args.readiness && ACTIVE.includeReadiness ? readinessParagraphs(args.readiness) : []),
          ...(args.reconstructions && ACTIVE.includeMapping ? reconstructionParagraphs(args.reconstructions, titleOf) : []),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
