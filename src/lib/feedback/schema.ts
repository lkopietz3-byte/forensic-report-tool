import { z } from "zod";

// Pure validation for the in-app "Help & feedback" capture. No server-only
// imports, so it unit-tests in node and can validate optimistically on the client.

export const feedbackInputSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  // Optional reply-to. The form sends "" when left blank, so accept the empty
  // string as well as a valid address.
  email: z
    .union([z.literal(""), z.string().trim().toLowerCase().email().max(254)])
    .optional(),
  // Set by our own surfaces only; the slug charset blocks log/CSV injection and
  // arbitrary stored values.
  source: z
    .string()
    .trim()
    .max(64)
    .regex(/^[a-zA-Z0-9_/-]+$/)
    .optional(),
  // The page path it was sent from, bounded.
  page: z.string().trim().max(200).optional(),
  // Honeypot: bots fill hidden fields; humans leave it empty. Bounded (not
  // rejected) so the route can detect a filled honeypot and fake-succeed rather
  // than 400 and signal the bot that something tripped.
  company: z.string().max(200).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

export function parseFeedbackInput(raw: unknown) {
  return feedbackInputSchema.safeParse(raw);
}
