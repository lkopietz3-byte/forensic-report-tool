// Deliverable style options — the formatting controls experts (and their
// retaining counsel) actually ask for: court-classic fonts, double spacing,
// Roman-numeral headings, cover page, footer text, and which appendices to
// attach. Pure data + helpers; both exporters consume the NORMALIZED form.
//
// DEFAULT_STYLE reproduces the exporters' historical look (fonts/spacing/
// numbering) — with ONE intentional exception: includeReadiness now defaults to
// FALSE. The internal readiness page (which can read "N items to resolve before
// you sign") must never ship inside the served deliverable by default; it stays
// an opt-in QA aid for the expert's own file copy.
//
// HONESTY NOTE: includeDisclosure controls whether the AI-Use Disclosure
// appendix is attached to THIS file. The record itself always exists in-app and
// in the audit chain; whether and how to disclose is the expert's/counsel's
// call. The UI copy must say that plainly.

export type FontChoice = "default" | "times" | "sans" | "century";
export type LineSpacing = "single" | "onehalf" | "double";
export type HeadingNumbering = "decimal" | "roman" | "none";

export interface DeliverableStyle {
  /** default = the product's design fonts; times = court classic; sans = modern sans. */
  font: FontChoice;
  /** Body size in points (PDF) / half-points*2 (DOCX). 11 is the design default; 12 the court norm. */
  fontSizePt: 11 | 12;
  /** "single" = the current comfortable setting (DOCX line 288 twips / PDF lineGap 3.5). */
  lineSpacing: LineSpacing;
  headingNumbering: HeadingNumbering;
  includeCoverPage: boolean;
  /** Overrides the running-footer note when non-empty (e.g. "CONFIDENTIAL — DRAFT"). */
  footerText: string;
  /** Shown on the cover when non-empty (free text, e.g. "June 10, 2026"). */
  reportDate: string;
  /** Attach the AI-Use Disclosure appendix to this file (record always exists in-app). */
  includeDisclosure: boolean;
  /** Attach the data→opinion mapping appendix. */
  includeMapping: boolean;
  /** Attach the internal report-readiness QA page. Default OFF — it can name
   *  unresolved items and must not ship in the served deliverable unbidden. */
  includeReadiness: boolean;
  /** Court pleading-paper line numbering. Applied to the Word deliverable (the
   *  filed master); the typeset PDF hand-off is left clean. Default OFF. */
  lineNumbers: boolean;
  /** Optional firm logo on the cover, as a PNG data URL ("data:image/png;base64,…").
   *  Branding only — never evidence, never cited. Empty = no logo. */
  coverLogo: string;
}

export const DEFAULT_STYLE: DeliverableStyle = {
  font: "default",
  fontSizePt: 11,
  lineSpacing: "single",
  headingNumbering: "decimal",
  includeCoverPage: true,
  footerText: "",
  reportDate: "",
  includeDisclosure: true,
  includeMapping: true,
  includeReadiness: false,
  lineNumbers: false,
  coverLogo: "",
};

/** Merge a partial (e.g. from the API payload) onto the defaults. */
export function normalizeStyle(partial?: Partial<DeliverableStyle> | null): DeliverableStyle {
  return { ...DEFAULT_STYLE, ...(partial ?? {}) };
}

const ROMAN: Array<[number, string]> = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

export function toRoman(n: number): string {
  let out = "";
  let v = Math.max(1, Math.floor(n));
  for (const [val, sym] of ROMAN) {
    while (v >= val) {
      out += sym;
      v -= val;
    }
  }
  return out;
}

/** "1.  " / "I.  " / "" — the prefix both exporters put before a section title. */
export function headingPrefix(index: number, style: DeliverableStyle): string {
  if (style.headingNumbering === "none") return "";
  if (style.headingNumbering === "roman") return `${toRoman(index + 1)}.  `;
  return `${index + 1}.  `;
}

/** DOCX body line spacing in twips (240 = single). "single" keeps the historical 288. */
export function docxLineTwips(style: DeliverableStyle): number {
  switch (style.lineSpacing) {
    case "double": return 480;
    case "onehalf": return 360;
    default: return 288;
  }
}

/** PDF body lineGap in points. "single" keeps the historical 3.5. */
export function pdfLineGap(style: DeliverableStyle): number {
  switch (style.lineSpacing) {
    case "double": return 12;
    case "onehalf": return 7;
    default: return 3.5;
  }
}
