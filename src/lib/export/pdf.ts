import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import fontkit from "fontkit";
import { stripCitationMarkers } from "../domain/grounding";
import { modelDisplay } from "../domain/disclosure";
import type { DisclosureAppendix } from "../domain/disclosure.js";
import type { OpinionReconstruction } from "../domain/reconstruction.js";
import type { ReadinessVerdict } from "../domain/readiness.js";
import type { ExhibitTable, ReportMeta, ReportSection } from "../domain/types.js";
import { DEFAULT_STYLE, headingPrefix, pdfLineGap } from "./style";
import type { DeliverableStyle } from "./style";

// Renders the report + AI-Disclosure Appendix to a premium, court-grade PDF.
// PDF is the primary deliverable an expert hands to counsel — fixed layout,
// identical everywhere — so the typesetting here is the product's first
// impression for a $350–700/hr buyer. Embeds Source Serif 4 (body) + Inter
// (labels/headings); never falls back to Times. Citation markers are stripped
// from reader-facing prose; the appendix carries the auditable record.
//
// Closed-world note: the cover renders ONLY supplied data (matter, counsel,
// role, discipline, the expert's own name/credentials). It never invents a
// court, a docket caption, a date, or a signature — the signature line is left
// blank for the expert to sign.

// ─── Page geometry ──────────────────────────────────────────────────────────
// Wider side margins shorten the measure to ~6in (≈70–80 chars at 11pt serif),
// the single biggest "this looks expensive" tell for a legal document.
const MARGIN = { top: 78, bottom: 72, left: 90, right: 90 };

// ─── Palette (restraint: near-black ink + one deep accent) ──────────────────
const INK = "#1A1A1A"; // near-black body, not pure #000
const NAVY = "#1A2B4A"; // the single accent — headings, rules
const MUTED = "#6B7280";
const FAINT = "#9AA1AB";
const RULE = "#C7CCD1";
const ALARM = "#9F1D1D";
const AMBER_TEXT = "#92400E";
const SAMPLE_BG = "#FEF3C7";
const SAMPLE_BORDER = "#F59E0B";

type Doc = InstanceType<typeof PDFDocument>;
type Expert = { fullName: string; credentials?: string };
type TocEntry = { title: string; page: number; part: boolean };

// The deliverable style governing the export currently being built. Set once at
// the top of exportReportPdf. This module-level mutable is race-safe because
// all drawing is synchronous from that assignment through doc.end() — only the
// buffer collection (the 'data'/'end' events behind the returned Promise) is
// async — so two concurrent exports cannot interleave their drawing phases.
let ACTIVE: DeliverableStyle = DEFAULT_STYLE;

// ─── Font embedding ─────────────────────────────────────────────────────────
// Vendored static TTFs read once and registered per-document. process.cwd() is
// the app root at runtime; next.config's outputFileTracingIncludes keeps these
// files in the standalone bundle.
const FONT_FILES = {
  Serif: "SourceSerif4-Regular.ttf",
  "Serif-Italic": "SourceSerif4-Italic.ttf",
  "Serif-SemiBold": "SourceSerif4-SemiBold.ttf",
  "Serif-Bold": "SourceSerif4-Bold.ttf",
  Sans: "Inter-Regular.ttf",
  "Sans-SemiBold": "Inter-SemiBold.ttf",
  "Sans-Bold": "Inter-Bold.ttf",
} as const;

let fontBufferCache: Record<string, Buffer> | null = null;
function fontBuffers(): Record<string, Buffer> {
  if (!fontBufferCache) {
    const dir = path.join(process.cwd(), "src/lib/export/fonts");
    fontBufferCache = Object.fromEntries(
      Object.entries(FONT_FILES).map(([name, file]) => [
        name,
        fs.readFileSync(path.join(dir, file)),
      ]),
    );
  }
  return fontBufferCache;
}

function registerFonts(doc: Doc): void {
  const buffers = fontBuffers();
  for (const [name, buf] of Object.entries(buffers)) doc.registerFont(name, buf);
}

// ─── Glyph-support guard (verbatim record integrity) ───────────────────────
// The embedded fonts (Source Serif 4 / Inter) cover Latin, Cyrillic, Greek, and
// the typographic punctuation a US legal document needs — but NOT CJK, Arabic,
// Hebrew, and other scripts. PDFKit would render a missing glyph as a blank box
// and still resolve a 200, silently corrupting a verbatim quote from the record.
// For court evidence that is unacceptable: we detect any character the chosen
// body font cannot draw and fail loudly, so the expert can switch to the Word
// export (Word substitutes a system font) or transliterate the quote.
export class UnsupportedGlyphError extends Error {
  characters: string[];
  constructor(characters: string[]) {
    super(`Export font cannot render: ${characters.join(" ")}`);
    this.name = "UnsupportedGlyphError";
    this.characters = characters;
  }
}

// cp1252 (WinAnsi) code points above U+00FF that the standard-14 Times font can
// still render — so the "times" style isn't falsely flagged on smart quotes,
// dashes, the euro sign, etc.
const WINANSI_EXTRAS = new Set<number>([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030,
  0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022,
  0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

let glyphFontCache: Record<string, import("fontkit").Font> | null = null;
function glyphFont(file: string): import("fontkit").Font {
  if (!glyphFontCache) glyphFontCache = {};
  if (!glyphFontCache[file]) {
    const dir = path.join(process.cwd(), "src/lib/export/fonts");
    glyphFontCache[file] = fontkit.create(fs.readFileSync(path.join(dir, file)));
  }
  return glyphFontCache[file];
}

// Is this code point renderable by the active body font? Tab/newline/CR are
// always safe and never flagged.
function isCovered(cp: number, fontChoice: DeliverableStyle["font"]): boolean {
  if (cp === 0x09 || cp === 0x0a || cp === 0x0d) return true;
  if (fontChoice === "times" || fontChoice === "century") return cp <= 0xff || WINANSI_EXTRAS.has(cp);
  const file = fontChoice === "sans" ? "Inter-Regular.ttf" : "SourceSerif4-Regular.ttf";
  return glyphFont(file).hasGlyphForCodePoint(cp);
}

// Throws UnsupportedGlyphError if any reader-facing string contains a character
// the active body font cannot draw. App-generated labels are Latin and never
// flag; this targets the user-supplied content that carries verbatim record text.
function assertGlyphSupport(args: PdfArgs): void {
  const strings: (string | undefined)[] = [
    args.meta.matter, args.meta.retainingCounsel, args.meta.expertRole, args.meta.discipline,
    args.expert?.fullName, args.expert?.credentials,
    args.notice, args.style?.reportDate, args.style?.footerText,
  ];
  for (const s of args.sections) strings.push(s.title, s.finalText ?? s.draftText);
  for (const ex of args.exhibits ?? []) {
    strings.push(ex.label, ex.title, ex.caption, ex.footnote, ...ex.columns);
    for (const row of ex.rows) strings.push(...row);
  }
  for (const fig of args.figures ?? []) strings.push(fig.label);
  for (const e of args.disclosure.entries)
    for (const src of e.evidenceSources) strings.push(src.location);
  for (const r of args.reconstructions ?? []) {
    for (const src of r.reliedOn) strings.push(src.location);
    for (const src of r.fedButNotReliedOn) strings.push(src.location);
  }

  const bad = new Set<string>();
  const fontChoice = (args.style ?? DEFAULT_STYLE).font;
  for (const s of strings) {
    if (!s) continue;
    for (const ch of s) {
      if (!isCovered(ch.codePointAt(0)!, fontChoice)) bad.add(ch);
    }
  }
  if (bad.size > 0) throw new UnsupportedGlyphError([...bad]);
}

// PDFKit + fontkit substitute f-ligatures (fi/fl/ff/ffi…) by default. With our
// embedded Source Serif 4 the glyphs DRAW correctly, but the ToUnicode CMap maps
// the ligature glyph to a single character, so the PDF's copy/search/accessibility
// text layer silently drops letters — "Whitfield" extracts as "Whitfeld",
// "Plaintiff" as "Plaintif". In a document e-filed and read by counsel, search
// indexes, and screen readers, the text layer MUST be exact (this is the expert's
// own name). Disabling liga/dlig/clig/rlig keeps each letter a distinct glyph with
// a correct ToUnicode entry, at no visual cost. We patch doc.text once so every
// call inherits it rather than threading the option through ~30 call sites.
// fontkit accepts an object form ({liga:false}) at runtime to *disable* features;
// pdfkit's TS types only describe the enable-array form, hence the cast.
const NO_LIGATURES = { liga: false, dlig: false, clig: false, rlig: false } as unknown as PDFKit.Mixins.OpenTypeFeatures[];
function disableLigatures(doc: Doc): void {
  const original = doc.text.bind(doc);
  doc.text = function patchedText(
    text: string,
    x?: number | PDFKit.Mixins.TextOptions,
    y?: number | PDFKit.Mixins.TextOptions,
    options?: PDFKit.Mixins.TextOptions,
  ): Doc {
    // PDFKit's text(text, x={}, y, options={}) defaults x to {} and, when x is an
    // object, treats it AS the options — so text(text, undefined, undefined, opts)
    // silently drops opts. Route the no-positional forms through text(text, opts).
    if (typeof x !== "number") {
      const merged =
        x && typeof x === "object"
          ? { features: NO_LIGATURES, ...x }
          : { features: NO_LIGATURES };
      return original(text, merged);
    }
    return original(text, x, y as number | undefined, {
      features: NO_LIGATURES,
      ...(options ?? {}),
    });
  } as Doc["text"];
}

// ─── Style-driven font resolution ───────────────────────────────────────────
// Every call site in this file keeps its logical name ("Serif", "Sans-SemiBold",
// …); when the deliverable style asks for a different family we wrap doc.font
// once with a name map instead of threading the choice through ~60 call sites.
//
// "times" maps to pdfkit's standard-14 built-ins (Times-Roman / Times-Italic /
// Times-Bold) — no registration needed. Composition with disableLigatures()
// above is safe: that patch wraps doc.text (orthogonal to doc.font) and its
// behavior for the embedded fonts is untouched; for the standard-14 AFM fonts
// the features option is ignored by pdfkit's StandardFont (they carry no GSUB
// ligatures), so passing {liga:false,…} is a harmless no-op there.
// "default" applies no wrapper at all — the historical path is byte-identical.
const TIMES_FONTS: Record<string, string> = {
  Serif: "Times-Roman",
  "Serif-Italic": "Times-Italic",
  "Serif-SemiBold": "Times-Bold",
  "Serif-Bold": "Times-Bold",
  Sans: "Times-Roman",
  "Sans-SemiBold": "Times-Bold",
  "Sans-Bold": "Times-Bold",
};
const SANS_FONTS: Record<string, string> = {
  Serif: "Sans",
  "Serif-Italic": "Sans",
  "Serif-SemiBold": "Sans-SemiBold",
  "Serif-Bold": "Sans-Bold",
};

function applyFontChoice(doc: Doc): void {
  if (ACTIVE.font === "default") return;
  // "century" has no standard-14 equivalent and we don't vendor its TTF, so the
  // PDF falls back to Times (the closest court-classic serif); the DOCX carries
  // the real Century Schoolbook. Both are documented in the deliverable options.
  const map = ACTIVE.font === "times" || ACTIVE.font === "century" ? TIMES_FONTS : SANS_FONTS;
  const original = doc.font.bind(doc);
  doc.font = function mappedFont(
    src: string | Buffer,
    family?: string | number,
    size?: number,
  ): Doc {
    const resolved = typeof src === "string" ? (map[src] ?? src) : src;
    // pdfkit overloads: font(src, size?) | font(src, family, size?).
    if (typeof family === "string") return original(resolved, family, size);
    return original(resolved, family);
  } as Doc["font"];
}

// ─── Layout primitives ──────────────────────────────────────────────────────
function ML(doc: Doc): number {
  return doc.page.margins.left;
}
function MR(doc: Doc): number {
  return doc.page.width - doc.page.margins.right;
}
function contentWidth(doc: Doc): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function ensureSpace(doc: Doc, needed: number): void {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) doc.addPage();
}

function hr(doc: Doc, color = RULE, width = 0.75): void {
  doc
    .moveTo(ML(doc), doc.y)
    .lineTo(MR(doc), doc.y)
    .lineWidth(width)
    .strokeColor(color)
    .stroke();
  doc.moveDown(0.55);
}

function eyebrow(doc: Doc, text: string): void {
  doc
    .font("Sans-SemiBold")
    .fontSize(8.5)
    .fillColor(MUTED)
    .text(text.toUpperCase(), { characterSpacing: 1.4 });
  doc.moveDown(0.25);
}

// "[Expert input needed: …]" open-item marker, styled as an amber draft-note in
// the exported document so it can never read as the expert's own opinion prose.
const OPEN_ITEM_RE = /\[Expert input needed:[^\]]*\]/gi;

function body(doc: Doc, text: string): void {
  if (!/\[Expert input needed:/i.test(text)) {
    doc
      .font("Serif")
      .fontSize(ACTIVE.fontSizePt)
      .fillColor(INK)
      .text(text, { align: "justify", lineGap: pdfLineGap(ACTIVE) });
    return;
  }
  // Mixed prose + open-item notes: render as chained runs (left-aligned, so the
  // per-run style changes don't fight the justifier).
  const size = ACTIVE.fontSizePt;
  const segs: { t: string; note: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(OPEN_ITEM_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) segs.push({ t: text.slice(last, idx), note: false });
    segs.push({ t: m[0], note: true });
    last = idx + m[0].length;
  }
  if (last < text.length) segs.push({ t: text.slice(last), note: false });
  segs.forEach((s, i) => {
    doc
      .font(s.note ? "Sans-SemiBold" : "Serif")
      .fontSize(size)
      .fillColor(s.note ? AMBER_TEXT : INK)
      .text(s.t, { lineGap: pdfLineGap(ACTIVE), continued: i < segs.length - 1 });
  });
}

// Prominent stamp at the top of the body whenever open "[Expert input needed]"
// items remain — a working draft must never look like a final deliverable.
function draftBanner(doc: Doc, count: number): void {
  doc.font("Sans-SemiBold").fontSize(12).fillColor(ALARM).text("DRAFT — INCOMPLETE, NOT FOR FILING", { align: "center" });
  doc.moveDown(0.2);
  doc
    .font("Serif-Italic")
    .fontSize(9.5)
    .fillColor(MUTED)
    .text(
      `This report still contains ${count} item${count === 1 ? "" : "s"} marked “[Expert input needed]” for the expert to complete before signing.`,
      { align: "center", lineGap: 1 },
    );
  doc.moveDown(0.4);
  hr(doc, AMBER_TEXT, 1);
  doc.moveDown(0.6);
}

function paraBlock(doc: Doc, text: string): void {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // 0.5pt tighter than body() — preserves the historical 3 vs 3.5 split.
    doc
      .font("Serif")
      .fontSize(ACTIVE.fontSizePt)
      .fillColor(INK)
      .text(line, { lineGap: Math.max(0, pdfLineGap(ACTIVE) - 0.5) });
    doc.moveDown(0.12);
  }
}

function labelValue(doc: Doc, label: string, value: string, valueColor = INK): void {
  doc
    .font("Sans-SemiBold")
    .fontSize(9.5)
    .fillColor(INK)
    .text(label, { continued: true });
  doc.font("Serif").fontSize(11).fillColor(valueColor).text(`  ${value}`);
  doc.moveDown(0.22);
}

function centered(
  doc: Doc,
  text: string,
  opts: { font: string; size: number; color: string; tracking?: number; gap?: number },
): void {
  doc
    .font(opts.font)
    .fontSize(opts.size)
    .fillColor(opts.color)
    .text(text, ML(doc), doc.y, {
      width: contentWidth(doc),
      align: "center",
      characterSpacing: opts.tracking ?? 0,
      lineGap: opts.gap ?? 0,
    });
}

function sectionHeading(doc: Doc, toc: TocEntry[], title: string): void {
  ensureSpace(doc, 66);
  doc.moveDown(0.7);
  toc.push({ title, page: doc.bufferedPageRange().count - 1, part: false });
  doc
    .font("Sans-SemiBold")
    .fontSize(ACTIVE.fontSizePt + 1)
    .fillColor(NAVY)
    .text(title, { characterSpacing: 0.2 });
  doc.moveDown(0.18);
  hr(doc);
}

function subLabel(doc: Doc, text: string): void {
  doc.moveDown(0.2);
  doc.font("Sans-SemiBold").fontSize(10).fillColor(NAVY).text(text);
  doc.moveDown(0.18);
}

// "scope_of_assignment" → "Scope of assignment" — the disclosure entries carry
// raw section keys; humanize them for the reader-facing appendix.
function humanizeKey(key: string): string {
  const s = key.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// A light two-column table: a bold/sub left cell and a wrapped right cell, with a
// faint divider under each row and a header that repeats after a page break.
// Used for the disclosure's section→evidence map and the data→opinion mapping —
// far easier to scan than a run-on list, and it reads as court-grade.
type TableRow = { title: string; sub?: string; right: string; rightColor?: string };
function twoColTable(
  doc: Doc,
  headers: [string, string],
  rows: TableRow[],
  leftFraction = 0.34,
): void {
  const left = ML(doc);
  const totalW = contentWidth(doc);
  const gap = 16;
  const lw = Math.round(totalW * leftFraction);
  const rw = totalW - lw - gap;
  const rx = left + lw + gap;
  const padV = 7;

  const drawHeader = (): void => {
    const hy = doc.y;
    doc.font("Sans-SemiBold").fontSize(7.5).fillColor(MUTED);
    doc.text(headers[0].toUpperCase(), left, hy, { width: lw, characterSpacing: 0.8 });
    doc.text(headers[1].toUpperCase(), rx, hy, { width: rw, characterSpacing: 0.8 });
    doc.y = hy + 12;
    doc.moveTo(left, doc.y).lineTo(left + totalW, doc.y).lineWidth(0.75).strokeColor(NAVY).stroke();
    doc.y += 6;
  };

  drawHeader();

  for (const row of rows) {
    doc.font("Serif-SemiBold").fontSize(10.5);
    const titleH = doc.heightOfString(row.title, { width: lw });
    let subH = 0;
    if (row.sub) {
      doc.font("Sans").fontSize(8);
      subH = doc.heightOfString(row.sub, { width: lw }) + 1;
    }
    doc.font("Serif").fontSize(10);
    const rightH = doc.heightOfString(row.right, { width: rw, lineGap: 1.5 });
    const rowH = Math.max(titleH + subH, rightH) + padV * 2;

    const bottom = doc.page.height - doc.page.margins.bottom;
    if (doc.y + rowH > bottom) {
      doc.addPage();
      drawHeader();
    }

    const top = doc.y + padV;
    doc.font("Serif-SemiBold").fontSize(10.5).fillColor(INK).text(row.title, left, top, { width: lw });
    if (row.sub) {
      doc.font("Sans").fontSize(8).fillColor(MUTED).text(row.sub, left, top + titleH + 1, { width: lw });
    }
    doc
      .font("Serif")
      .fontSize(10)
      .fillColor(row.rightColor ?? INK)
      .text(row.right, rx, top, { width: rw, lineGap: 1.5 });

    const dividerY = top + Math.max(titleH + subH, rightH) + padV;
    doc.moveTo(left, dividerY).lineTo(left + totalW, dividerY).lineWidth(0.4).strokeColor(RULE).stroke();
    doc.y = dividerY + 6;
  }

  doc.x = left;
  doc.moveDown(0.2);
}

// ─── Exhibit data tables (multi-column) ─────────────────────────────────────
// A generic N-column table for attached exhibits, with wrapped cells, a navy
// header underline, hairline row dividers, and page-break handling that redraws
// the header on the continued page. Columns are evenly spaced unless the exhibit
// supplies colFractions.
function exhibitDataTable(doc: Doc, ex: ExhibitTable): void {
  const left = ML(doc);
  const totalW = contentWidth(doc);
  const n = ex.columns.length;
  const gap = 8;
  const fractions =
    ex.colFractions && ex.colFractions.length === n
      ? ex.colFractions
      : Array(n).fill(1 / n);
  const usable = totalW - gap * (n - 1);
  const colW = fractions.map((f) => Math.max(24, usable * f));
  const colX: number[] = [];
  let cx = left;
  for (let i = 0; i < n; i++) {
    colX.push(cx);
    cx += colW[i] + gap;
  }
  const padV = 6;

  const drawHeader = (): void => {
    const hy = doc.y;
    doc.font("Sans-SemiBold").fontSize(7).fillColor(MUTED);
    let maxH = 0;
    for (let i = 0; i < n; i++) {
      maxH = Math.max(maxH, doc.heightOfString(ex.columns[i].toUpperCase(), { width: colW[i], characterSpacing: 0.6 }));
    }
    for (let i = 0; i < n; i++) {
      doc.text(ex.columns[i].toUpperCase(), colX[i], hy, { width: colW[i], characterSpacing: 0.6 });
    }
    doc.y = hy + maxH + 3;
    doc.moveTo(left, doc.y).lineTo(left + totalW, doc.y).lineWidth(0.75).strokeColor(NAVY).stroke();
    doc.y += 5;
  };

  drawHeader();

  for (const row of ex.rows) {
    doc.font("Serif").fontSize(9.5);
    let cellH = 0;
    for (let i = 0; i < n; i++) {
      cellH = Math.max(cellH, doc.heightOfString(row[i] ?? "", { width: colW[i], lineGap: 1.5 }));
    }
    const rowH = cellH + padV * 2;
    const bottom = doc.page.height - doc.page.margins.bottom;
    if (doc.y + rowH > bottom) {
      doc.addPage();
      drawHeader();
    }
    const top = doc.y + padV;
    doc.font("Serif").fontSize(9.5).fillColor(INK);
    for (let i = 0; i < n; i++) {
      doc.text(row[i] ?? "", colX[i], top, { width: colW[i], lineGap: 1.5 });
    }
    const dividerY = top + cellH + padV;
    doc.moveTo(left, dividerY).lineTo(left + totalW, dividerY).lineWidth(0.4).strokeColor(RULE).stroke();
    doc.y = dividerY + 5;
  }
  doc.x = left;
}

// Image evidence rendered as numbered figures (its own attachment section). The
// images are case material the expert supplied — cited by id in the body and
// disclosed like any evidence; this just renders them. Client re-encodes them as
// PNG, so dimensions come straight from the IHDR.
function figuresSection(doc: Doc, toc: TocEntry[], figures: { n: number; label: string; imageData: string }[]): void {
  if (figures.length === 0) return;
  doc.addPage();
  eyebrow(doc, "Attachments");
  toc.push({ title: "Figures", page: doc.bufferedPageRange().count - 1, part: true });
  doc.font("Serif-Bold").fontSize(20).fillColor(NAVY).text("Figures");
  doc.moveDown(0.3);
  hr(doc, NAVY, 1);
  doc.moveDown(0.5);

  const cw = contentWidth(doc);
  const left = ML(doc);
  for (const fig of figures) {
    const m = /^data:image\/png;base64,(.+)$/.exec(fig.imageData);
    if (!m) continue;
    try {
      const buf = Buffer.from(m[1]!, "base64");
      if (buf.length < 24) continue;
      // The data-URL prefix is client-supplied; verify the bytes really are a PNG
      // (magic 0x89504E47) before the renderer decodes them, so non-PNG data that
      // slipped past the prefix check is skipped, not handed to PDFKit.
      if (buf.readUInt32BE(0) !== 0x89504e47) continue;
      const iw = buf.readUInt32BE(16);
      const ih = buf.readUInt32BE(20);
      if (!iw || !ih) continue;
      const scale = Math.min(cw / iw, 380 / ih, 1);
      const w = iw * scale;
      const h = ih * scale;
      ensureSpace(doc, h + 44);
      doc.moveDown(0.4);
      const y = doc.y;
      doc.image(buf, left + (cw - w) / 2, y, { width: w, height: h });
      doc.y = y + h + 8;
      doc
        .font("Serif-Italic")
        .fontSize(9)
        .fillColor(MUTED)
        .text(`Figure ${fig.n} — ${fig.label}`, left, doc.y, { width: cw, align: "center", lineGap: 1.5 });
      doc.moveDown(0.6);
    } catch {
      // A malformed figure must never break the export — skip it.
    }
  }
}

function exhibitsSection(doc: Doc, toc: TocEntry[], exhibits: ExhibitTable[]): void {
  if (exhibits.length === 0) return;
  doc.addPage();
  eyebrow(doc, "Attachments");
  toc.push({ title: "Exhibits", page: doc.bufferedPageRange().count - 1, part: true });
  doc.font("Serif-Bold").fontSize(20).fillColor(NAVY).text("Exhibits");
  doc.moveDown(0.3);
  hr(doc, NAVY, 1);
  doc.moveDown(0.5);

  for (const ex of exhibits) {
    ensureSpace(doc, 96);
    doc.moveDown(0.4);
    doc.x = ML(doc);
    doc.font("Sans-SemiBold").fontSize(11).fillColor(NAVY).text(`${ex.label} — `, { continued: true });
    doc.font("Serif-Bold").fontSize(11).fillColor(INK).text(ex.title);
    doc.moveDown(0.25);
    if (ex.caption) {
      doc.font("Serif-Italic").fontSize(9).fillColor(MUTED).text(ex.caption, { lineGap: 1.5 });
      doc.moveDown(0.35);
    }
    exhibitDataTable(doc, ex);
    if (ex.footnote) {
      doc.moveDown(0.1);
      doc.x = ML(doc);
      doc.font("Sans").fontSize(7.5).fillColor(FAINT).text(ex.footnote, { lineGap: 1.2 });
    }
    doc.moveDown(0.5);
  }
}

// ─── Cover page ─────────────────────────────────────────────────────────────
function coverPage(doc: Doc, meta: ReportMeta, expert?: Expert, notice?: string): void {
  doc.addPage();
  const cw = contentWidth(doc);
  const left = ML(doc);

  let topY = doc.page.margins.top;
  if (notice) {
    const padX = 12;
    const padY = 8;
    doc.font("Sans-SemiBold").fontSize(8.5);
    const textH = doc.heightOfString(notice, { width: cw - padX * 2, characterSpacing: 0.3 });
    const boxH = textH + padY * 2;
    doc.roundedRect(left, topY, cw, boxH, 4).fillAndStroke(SAMPLE_BG, SAMPLE_BORDER);
    doc
      .fillColor(AMBER_TEXT)
      .text(notice, left + padX, topY + padY, {
        width: cw - padX * 2,
        characterSpacing: 0.3,
      });
    topY += boxH + 18;
  }

  // Optional firm logo, centered near the top (branding only — never evidence).
  // The client re-encodes it as PNG, so dimensions come straight from the IHDR.
  if (ACTIVE.coverLogo) {
    const m = /^data:image\/png;base64,(.+)$/.exec(ACTIVE.coverLogo.trim());
    if (m) {
      try {
        const buf = Buffer.from(m[1]!, "base64");
        if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47) {
          const iw = buf.readUInt32BE(16);
          const ih = buf.readUInt32BE(20);
          if (iw && ih) {
            const scale = Math.min(140 / iw, 56 / ih, 1);
            const w = iw * scale;
            const h = ih * scale;
            doc.image(buf, left + (cw - w) / 2, topY, { width: w, height: h });
          }
        }
      } catch {
        // A malformed logo must never break the export — skip it.
      }
    }
  }

  // Title block, anchored in the upper third.
  doc.y = doc.page.height * 0.3;
  centered(doc, "Fed. R. Civ. P. 26(a)(2)(B)", {
    font: "Sans-SemiBold",
    size: 9,
    color: NAVY,
    tracking: 2.2,
  });
  doc.moveDown(0.7);
  hr(doc, NAVY, 1);
  doc.moveDown(0.9);

  if (expert?.fullName) {
    centered(doc, "Expert Report of", {
      font: "Sans-SemiBold",
      size: 10.5,
      color: MUTED,
      tracking: 2,
    });
    doc.moveDown(0.5);
    centered(doc, expert.fullName, { font: "Serif-Bold", size: 23, color: NAVY });
  } else {
    centered(doc, "Expert Report", { font: "Serif-Bold", size: 26, color: NAVY });
  }
  doc.moveDown(0.6);
  centered(doc, meta.expertRole, { font: "Serif-Italic", size: 13, color: INK, gap: 2 });

  doc.moveDown(1.4);
  hr(doc, RULE, 0.75);
  doc.moveDown(0.9);

  centered(doc, meta.matter, { font: "Serif-SemiBold", size: 13.5, color: INK, gap: 2 });
  doc.moveDown(0.6);
  centered(doc, `Retained by ${meta.retainingCounsel}`, {
    font: "Serif",
    size: 11,
    color: MUTED,
  });
  doc.moveDown(0.2);
  centered(doc, meta.discipline, { font: "Serif", size: 11, color: MUTED });

  // Closed-world: the date is the expert's own free-text input (style option),
  // never inferred. Rendered only when supplied.
  if (ACTIVE.reportDate.trim()) {
    doc.moveDown(0.2);
    centered(doc, ACTIVE.reportDate.trim(), { font: "Serif", size: 11, color: MUTED });
  }

  // Confidentiality legend pinned near the foot of the cover.
  doc.y = doc.page.height - doc.page.margins.bottom - 14;
  centered(doc, "DRAFT — NOT SIGNED", {
    font: "Sans-SemiBold",
    size: 8,
    color: FAINT,
    tracking: 1.3,
  });
}

// ─── Table of contents (second pass, written into a reserved page) ──────────
function writeTableOfContents(doc: Doc, tocIdx: number, toc: TocEntry[]): void {
  doc.switchToPage(tocIdx);
  doc.x = ML(doc);
  doc.y = doc.page.margins.top;

  eyebrow(doc, "Contents");
  doc.font("Serif-Bold").fontSize(20).fillColor(NAVY).text("Table of Contents");
  doc.moveDown(0.3);
  hr(doc, NAVY, 1);
  doc.moveDown(0.6);

  for (const entry of toc) {
    const y = doc.y;
    // entry.page is the 0-based buffered index; +1 is purely the 0→1-based
    // conversion to the physical page number. It matches the footer's
    // `Page ${i + 1} of N` in both cover modes — no cover offset belongs here.
    const pageLabel = String(entry.page + 1);
    const titleFont = entry.part ? "Sans-SemiBold" : "Serif";
    const titleColor = entry.part ? NAVY : INK;
    const indent = entry.part ? 0 : 0;

    doc
      .font(titleFont)
      .fontSize(entry.part ? 10.5 : 11)
      .fillColor(titleColor)
      .text(entry.title, ML(doc) + indent, y, {
        width: contentWidth(doc) - 28,
        lineBreak: false,
        ellipsis: true,
      });
    doc
      .font("Sans")
      .fontSize(10)
      .fillColor(MUTED)
      .text(pageLabel, ML(doc), y, { width: contentWidth(doc), align: "right" });
    doc.moveDown(entry.part ? 0.55 : 0.42);
  }
}

// ─── Report sections ────────────────────────────────────────────────────────
function reportSections(doc: Doc, toc: TocEntry[], sections: ReportSection[]): void {
  sections.forEach((section, i) => {
    const text = stripCitationMarkers(section.finalText ?? section.draftText);
    sectionHeading(doc, toc, headingPrefix(i, ACTIVE) + section.title);
    if (text.trim().length === 0) {
      doc.font("Serif-Italic").fontSize(11).fillColor(MUTED).text("(no content)");
      return;
    }
    body(doc, text);
  });
}

// ─── Certification / signature block ────────────────────────────────────────
function certificationSection(
  doc: Doc,
  toc: TocEntry[],
  meta: ReportMeta,
  expert?: Expert,
): void {
  sectionHeading(doc, toc, "Certification of the Expert");
  body(
    doc,
    `I prepared this report in my capacity as ${meta.expertRole}. The opinions ` +
      "stated are my own and rest on the materials identified in this report. I am " +
      "the professional who reviewed and adopted this report and remain responsible " +
      "for every fact and opinion stated herein.",
  );

  ensureSpace(doc, 110);
  doc.moveDown(2);
  const x = ML(doc);
  const sigY = doc.y;
  doc.moveTo(x, sigY).lineTo(x + 280, sigY).lineWidth(0.75).strokeColor(INK).stroke();
  doc.moveDown(0.35);
  doc.font("Serif-Bold").fontSize(11).fillColor(INK).text(expert?.fullName ?? meta.expertRole);
  if (expert?.credentials) {
    doc.font("Serif").fontSize(9.5).fillColor(MUTED).text(expert.credentials, {
      width: 320,
      lineGap: 1,
    });
  }

  doc.moveDown(0.9);
  const dy = doc.y;
  doc.font("Sans-SemiBold").fontSize(9.5).fillColor(INK).text("Date:", x, dy);
  const dw = doc.widthOfString("Date:") + 10;
  doc
    .moveTo(x + dw, dy + 11)
    .lineTo(x + dw + 150, dy + 11)
    .lineWidth(0.75)
    .strokeColor(INK)
    .stroke();
}

// ─── AI-Use Disclosure appendix ─────────────────────────────────────────────
function disclosureSection(doc: Doc, toc: TocEntry[], appendix: DisclosureAppendix, titleOf: (key: string) => string): void {
  doc.addPage();
  eyebrow(doc, "Appendix");
  toc.push({ title: "AI-Use Disclosure", page: doc.bufferedPageRange().count - 1, part: true });
  doc.font("Serif-Bold").fontSize(20).fillColor(NAVY).text("AI-Use Disclosure");
  doc.moveDown(0.3);
  hr(doc, NAVY, 1);
  doc.moveDown(0.3);

  body(doc, appendix.statement);
  doc.moveDown(0.5);

  subLabel(doc, "Tools and models used");
  for (const m of appendix.models) {
    doc.font("Serif").fontSize(11).fillColor(INK).text(`•  ${m}`, { indent: 8 });
  }
  doc.moveDown(0.5);

  subLabel(doc, "AI-assisted sections");
  doc
    .font("Serif-Italic")
    .fontSize(9.5)
    .fillColor(MUTED)
    .text(
      "Each report section the tool helped structure, the model that assisted it, and the " +
        "evidence the expert provided to the tool for that section.",
      { lineGap: 1.5 },
    );
  doc.moveDown(0.35);
  twoColTable(
    doc,
    ["Section", "Evidence provided to the tool"],
    appendix.entries.map((entry) => ({
      title: titleOf(entry.sectionKey),
      sub: modelDisplay(entry.model, entry.modelVersion),
      right: entry.evidenceSources.length
        ? entry.evidenceSources.map((s) => s.location).join("; ")
        : "(none provided)",
    })),
  );

  doc.moveDown(0.2);
  subLabel(doc, "Record integrity");
  doc
    .font("Serif")
    .fontSize(10.5)
    .fillColor(appendix.integrity.verified ? INK : ALARM)
    .text(appendix.integrity.note, { lineGap: 1.5 });
}

// ─── Data-to-opinion mapping ────────────────────────────────────────────────
function reconstructionSection(
  doc: Doc,
  toc: TocEntry[],
  reconstructions: OpinionReconstruction[],
  titleOf: (key: string) => string,
): void {
  const aiAssisted = reconstructions.filter((r) => r.aiAssisted);
  if (aiAssisted.length === 0) return;

  sectionHeading(doc, toc, "Data-to-opinion mapping (for a challenged opinion)");
  body(
    doc,
    "For each AI-assisted opinion, the evidence the signed text relies on is listed " +
      "separately from evidence that was provided but not cited. The tool cannot cite any " +
      "material it was not given, so every citation resolves to a source the expert supplied.",
  );
  doc.moveDown(0.4);

  for (const r of aiAssisted) {
    ensureSpace(doc, 64);
    doc.font("Sans-SemiBold").fontSize(10.5).fillColor(NAVY).text(titleOf(r.sectionKey));
    doc.moveDown(0.18);

    const reliedOn = r.reliedOn.length
      ? r.reliedOn.map((s) => s.location).join("; ")
      : "(none cited)";
    const considered = r.fedButNotReliedOn.length
      ? r.fedButNotReliedOn.map((s) => s.location).join("; ")
      : "(none)";
    labelValue(doc, "Relied on (cited in the signed opinion):", reliedOn);
    labelValue(doc, "Also considered (provided, not cited):", considered);

    if (r.reliedOnButNeverFed.length > 0) {
      doc
        .font("Sans-SemiBold")
        .fontSize(10)
        .fillColor(ALARM)
        .text(
          `INTEGRITY ALARM — cites evidence never provided to the tool: ${r.reliedOnButNeverFed.join(", ")}. Resolve before signing.`,
          { lineGap: 1.5 },
        );
    }
    doc.moveDown(0.45);
  }
}

// ─── Readiness check (tool QA, last) ────────────────────────────────────────
function readinessSection(doc: Doc, toc: TocEntry[], readiness: ReadinessVerdict): void {
  sectionHeading(doc, toc, "Report readiness check");
  doc
    .font("Serif-Bold")
    .fontSize(11.5)
    .fillColor(readiness.blockers > 0 ? ALARM : readiness.warnings > 0 ? AMBER_TEXT : NAVY)
    .text(readiness.headline);
  doc.moveDown(0.3);
  doc
    .font("Serif-Italic")
    .fontSize(9.5)
    .fillColor(MUTED)
    .text(
      "Automated internal checks — completeness, every sentence cited to the evidence, and disclosure-record integrity. Not a determination of admissibility, which is the court's.",
      { lineGap: 1.5 },
    );
  doc.moveDown(0.4);

  if (readiness.findings.length === 0) {
    doc.font("Serif").fontSize(11).fillColor(INK).text("No open findings.");
    return;
  }

  for (const f of readiness.findings) {
    ensureSpace(doc, 26);
    const isBlocker = f.severity === "blocker";
    doc
      .font("Sans-SemiBold")
      .fontSize(8.5)
      .fillColor(isBlocker ? ALARM : AMBER_TEXT)
      .text(isBlocker ? "BLOCKER" : "OPEN ITEM", { continued: true });
    doc
      .font("Serif")
      .fontSize(11)
      .fillColor(INK)
      .text(`  ${f.message}`, { lineGap: 1.5 });
    doc.moveDown(0.22);
  }
}

// ─── Running headers + footers (skip the cover, when there is one) ──────────
function addHeadersFooters(doc: Doc, meta: ReportMeta, footerNote: string): void {
  const range = doc.bufferedPageRange();
  // Page roles depend on the style. With a cover: page 0 is the (unnumbered)
  // cover, page 1 the TOC, body from page 2. Without one: the TOC is page 0 and
  // gets a footer like any other page; body starts at page 1. Printed numbers
  // stay positional (index + 1), in lockstep with the TOC's `entry.page + 1`.
  const coverPages = ACTIVE.includeCoverPage ? 1 : 0;
  const firstBodyPage = range.start + coverPages + 1; // first page after the TOC
  for (let i = range.start; i < range.start + range.count; i++) {
    if (coverPages > 0 && i === range.start) continue; // cover carries no header/footer
    doc.switchToPage(i);
    const savedBottom = doc.page.margins.bottom;
    const savedTop = doc.page.margins.top;
    doc.page.margins.bottom = 0;
    doc.page.margins.top = 0;

    // Running header on body pages (after the TOC).
    if (i >= firstBodyPage) {
      doc
        .font("Sans")
        .fontSize(7.5)
        .fillColor(FAINT)
        .text(meta.matter, ML(doc), 42, {
          width: contentWidth(doc) * 0.7,
          characterSpacing: 0.3,
          lineBreak: false,
          ellipsis: true,
        });
      doc
        .font("Sans-SemiBold")
        .fontSize(7.5)
        .fillColor(FAINT)
        .text("EXPERT REPORT", ML(doc), 42, {
          width: contentWidth(doc),
          align: "right",
          characterSpacing: 1,
        });
      doc
        .moveTo(ML(doc), 54)
        .lineTo(MR(doc), 54)
        .lineWidth(0.5)
        .strokeColor(RULE)
        .stroke();
    }

    // Footer on every non-cover page.
    const fy = doc.page.height - 50;
    doc
      .moveTo(ML(doc), fy - 6)
      .lineTo(MR(doc), fy - 6)
      .lineWidth(0.5)
      .strokeColor(RULE)
      .stroke();
    doc.font("Sans").fontSize(8).fillColor(MUTED);
    doc.text(footerNote, ML(doc), fy, { width: contentWidth(doc) / 2 });
    doc.text(`Page ${i + 1} of ${range.count}`, ML(doc), fy, {
      width: contentWidth(doc),
      align: "right",
    });

    doc.page.margins.bottom = savedBottom;
    doc.page.margins.top = savedTop;
  }
}

type PdfArgs = {
  meta: ReportMeta;
  sections: ReportSection[];
  disclosure: DisclosureAppendix;
  reconstructions?: OpinionReconstruction[];
  readiness?: ReadinessVerdict;
  /** Optional tabular exhibits attached after the certification. */
  exhibits?: ExhibitTable[];
  figures?: { n: number; label: string; imageData: string }[];
  /** The expert's own name/credentials — drives the cover title and signature. */
  expert?: Expert;
  /** Optional banner rendered on the cover — e.g. a "sample, not for filing" notice. */
  notice?: string;
  /** Deliverable formatting options; omitted = DEFAULT_STYLE = historical output. */
  style?: DeliverableStyle;
};

export function exportReportPdf(args: PdfArgs): Promise<Buffer> {
  // Pin the style for this export. Safe despite being module-level state: the
  // Promise executor below runs synchronously, and every drawing call through
  // doc.end() is synchronous too — only collecting the output buffer (the
  // 'data'/'end' events) is async — so concurrent exports cannot interleave
  // while pages are being drawn.
  ACTIVE = args.style ?? DEFAULT_STYLE;
  // Resolve section keys to the report's actual headings so the appendices name
  // sections exactly as the body does; fall back to a humanized key otherwise.
  const titleOf = (key: string): string =>
    args.sections.find((s) => s.key === key)?.title ?? humanizeKey(key);
  const openItemCount = args.sections.reduce(
    (n, s) => n + ((s.finalText ?? s.draftText).match(OPEN_ITEM_RE)?.length ?? 0),
    0,
  );
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: MARGIN,
      bufferPages: true,
      autoFirstPage: false,
      info: {
        Title: `Expert Report — ${args.meta.matter}`,
        Author: args.expert?.fullName ?? args.meta.expertRole,
        Subject: "Fed. R. Civ. P. 26(a)(2)(B) Expert Report",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      // Fail loudly (→ 422 at the route) rather than silently emitting blank
      // boxes for characters the body font cannot draw.
      assertGlyphSupport(args);
      registerFonts(doc);
      disableLigatures(doc);
      applyFontChoice(doc);
      doc.font("Serif");

      const toc: TocEntry[] = [];

      if (ACTIVE.includeCoverPage) coverPage(doc, args.meta, args.expert, args.notice);

      // Reserve the TOC page; fill it on the second pass once page numbers exist.
      doc.addPage();
      const tocIdx = doc.bufferedPageRange().count - 1;

      doc.addPage();
      if (openItemCount > 0) draftBanner(doc, openItemCount);
      reportSections(doc, toc, args.sections);
      certificationSection(doc, toc, args.meta, args.expert);
      if (args.figures) figuresSection(doc, toc, args.figures);
      if (args.exhibits) exhibitsSection(doc, toc, args.exhibits);
      // Appendix toggles: the disclosure RECORD always exists in-app/audit chain;
      // these only control what is attached to THIS file (see style.ts).
      if (ACTIVE.includeDisclosure) disclosureSection(doc, toc, args.disclosure, titleOf);
      if (args.reconstructions && ACTIVE.includeMapping)
        reconstructionSection(doc, toc, args.reconstructions, titleOf);
      if (args.readiness && ACTIVE.includeReadiness)
        readinessSection(doc, toc, args.readiness);

      writeTableOfContents(doc, tocIdx, toc);

      const footerNote =
        ACTIVE.footerText.trim() ||
        (args.notice
          ? "SAMPLE — not for filing"
          : "DRAFT — NOT SIGNED");
      addHeadersFooters(doc, args.meta, footerNote);

      doc.end();
    } catch (err) {
      reject(err as Error);
    }
  });
}
