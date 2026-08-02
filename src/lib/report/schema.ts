import { z } from "zod";
import { VOCREHAB_TEMPLATE } from "../domain/template";
import { MAX_UNITS } from "../draft/extract";

// Validation for the user-report builder (/api/report/build + /export). Bounds
// everything so a crafted payload can't blow up the draft pipeline or the
// renderer. Section keys are constrained to the discipline template.

const SECTION_KEYS = new Set(VOCREHAB_TEMPLATE.sections.map((s) => s.key));

// Postgres text columns reject NUL and most C0 control bytes. A converted PDF or
// OCR'd exhibit can carry them, and without this they pass validation but hard-
// fail the whole save with a generic Postgres error — and would desync the
// hashed audit content from what's stored. Strip C0 controls (keep \t and \n) at
// the trust boundary, before grounding, hashing, and persistence.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const stripControl = (s: string): string => s.replace(CONTROL_CHARS, "");

const EvidenceSchema = z.object({
  id: z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  content: z.string().trim().min(1).max(2_000).transform(stripControl),
  location: z.string().trim().min(1).max(160).transform(stripControl),
  // Optional figure image (PNG data URL) for image evidence. The client resizes
  // it small before sending; rendered as a numbered figure in the export. It is
  // NOT part of grounding (citations resolve by id, like any evidence) and is
  // not persisted on save yet — included only in the build/export payload.
  imageData: z
    .string()
    .max(800_000)
    .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, "image must be a PNG data URL")
    .optional(),
});

const SectionSchema = z.object({
  key: z.string().refine((k) => SECTION_KEYS.has(k as never), "Unknown section"),
  evidenceIds: z.array(z.string().trim().max(64)).max(MAX_UNITS).default([]),
  finalText: z.string().max(20_000).transform(stripControl).optional(),
  // A prior build's live draft, round-tripped on EXPORT so the deliverable is not
  // re-drafted (which would ship text the expert never reviewed and double the
  // token cost). Bounded like finalText; grounding re-runs on the adopted text, so
  // these never bypass the export gate. Omitted on the first build.
  draftText: z.string().max(20_000).transform(stripControl).optional(),
  draftModel: z.string().trim().max(128).optional(),
  draftModelVersion: z.string().trim().max(128).optional(),
});

// Deliverable formatting options (see src/lib/export/style.ts). Everything is
// optional — the route merges with DEFAULT_STYLE — and bounded so a payload
// can't smuggle arbitrary content into headers/footers.
const StyleSchema = z
  .object({
    font: z.enum(["default", "times", "sans", "century"]).optional(),
    fontSizePt: z.union([z.literal(11), z.literal(12)]).optional(),
    lineSpacing: z.enum(["single", "onehalf", "double"]).optional(),
    headingNumbering: z.enum(["decimal", "roman", "none"]).optional(),
    includeCoverPage: z.boolean().optional(),
    footerText: z.string().trim().max(120).optional(),
    // Restrict to date-plausible characters (letters, digits, spaces, and , . / -)
    // so injection-shaped payloads (javascript:, SQL, angle brackets) are rejected
    // at the boundary rather than passed to the exporter's cover page. A character
    // whitelist accepts every real date format — "June 14, 2026", "2026-06-14",
    // "14 June 2026", "June 2026" — without brittle format-matching.
    reportDate: z
      .string()
      .trim()
      .max(60)
      .regex(/^[A-Za-z0-9 ,.\/-]*$/, "report date may use only letters, numbers, spaces, and , . / -")
      .optional(),
    includeDisclosure: z.boolean().optional(),
    includeMapping: z.boolean().optional(),
    includeReadiness: z.boolean().optional(),
    lineNumbers: z.boolean().optional(),
    // Optional cover logo as a PNG data URL. Bounded so a payload can't smuggle a
    // huge blob; the client resizes the logo well under this before sending.
    coverLogo: z
      .string()
      .max(600_000)
      .regex(/^$|^data:image\/png;base64,[A-Za-z0-9+/=]+$/, "logo must be a PNG data URL")
      .optional(),
  })
  .optional();

export const reportInputSchema = z.object({
  meta: z.object({
    matter: z.string().trim().min(1).max(200),
    retainingCounsel: z.string().trim().max(200).default(""),
    expertRole: z.string().trim().max(200).default(""),
  }),
  profile: z.object({
    fullName: z.string().trim().min(1).max(160),
    credentials: z.string().trim().max(400).default(""),
    publicationsLast10yr: z.array(z.string().trim().max(400)).max(50).default([]),
    priorTestimonyLast4yr: z.array(z.string().trim().max(400)).max(100).default([]),
    compensationStatement: z.string().trim().max(1_000).default(""),
  }),
  evidence: z.array(EvidenceSchema).max(MAX_UNITS),
  sections: z.array(SectionSchema).min(1).max(30),
  style: StyleSchema,
  // When true, the expert has opted out of AI assistance: the report is
  // assembled by the rule-based structurer with no model call, and the
  // disclosure records that no AI produced any text. Default (false/absent) is
  // the AI-assisted path, gated the same way.
  noAi: z.boolean().optional(),
});

export type ReportInput = z.infer<typeof reportInputSchema>;

export function parseReportInput(raw: unknown) {
  return reportInputSchema.safeParse(raw);
}
