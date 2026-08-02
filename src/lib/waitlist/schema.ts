import { z } from "zod";
import { isDesignPartnerSource } from "./merge";

// Pure validation — no server-only imports so it stays unit-testable and can be
// reused on the client for optimistic checks.

export const DISCIPLINES = [
  "forensic_engineering",
  "accident_reconstruction",
  "vocational_rehabilitation",
  "other",
] as const;

export type Discipline = (typeof DISCIPLINES)[number];

// Rough annual report volume — the single most important pricing-validation
// signal (Fatal Risk #4: per-report vs. seat). Constrained so it stays analyzable.
export const REPORTS_PER_YEAR = ["1-3", "4-10", "11-25", "25+"] as const;
export type ReportsPerYear = (typeof REPORTS_PER_YEAR)[number];

export const waitlistInputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  discipline: z.enum(DISCIPLINES).optional(),
  // Honeypot: bots fill hidden fields; humans leave it empty. Accept a bounded
  // value here (don't reject) so the route can detect a filled honeypot and
  // return a fake success — rejecting at the schema would 400 and signal the bot
  // that something tripped. The route persists nothing when it's filled.
  company: z.string().max(200).optional(),
  // Constrained to a slug charset: source is set by our own form ids, so a
  // restricted pattern blocks log/CSV injection and arbitrary stored values.
  source: z
    .string()
    .trim()
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  // Async-discovery fields, captured by the /for-experts application form. All
  // free-text is length-bounded; stored as JSON (no CSV/log-injection surface)
  // and parameterized into Supabase.
  role: z.string().trim().max(120).optional(),
  reportsPerYear: z.enum(REPORTS_PER_YEAR).optional(),
  // The three structured discovery questions (replace the old single open box).
  painPoint: z.string().trim().max(1000).optional(),
  aiExperience: z.string().trim().max(1000).optional(),
  mustHave: z.string().trim().max(1000).optional(),
  // Optional catch-all.
  notes: z.string().trim().max(1000).optional(),
});

export type WaitlistInput = z.infer<typeof waitlistInputSchema>;

export function parseWaitlistInput(raw: unknown) {
  return waitlistInputSchema.safeParse(raw);
}

// The combined substance of a design-partner application's free-text answers.
const SUBSTANCE_FIELDS = ["painPoint", "aiExperience", "mustHave", "notes"] as const;

/**
 * Quality gate for /for-experts applications. A free design-partner slot is
 * earned, not auto-granted: an application must name a discipline and give a
 * real, substantive answer — not a blank or one-word submission. Returns null
 * when the application clears the bar, or a user-facing reason when it doesn't.
 * (The plain waitlist signup is exempt — only `source === "for-experts"`.)
 */
export function designPartnerQualityIssue(input: WaitlistInput): string | null {
  if (!isDesignPartnerSource(input.source)) return null;
  if (!input.discipline) {
    return "Please pick your discipline so we can match you to the right template.";
  }
  const substance = SUBSTANCE_FIELDS.map((k) => (input[k] ?? "").trim())
    .filter(Boolean);
  const total = substance.join(" ");
  if (substance.length < 2 || total.length < 60) {
    return "Tell us a bit more about your work — a couple of real sentences across the questions helps us review your application.";
  }
  return null;
}
