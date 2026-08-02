// Pure credit math, plan definitions, and the report content-fingerprint — no
// Supabase, so it unit-tests in node. It uses node:crypto, so it must stay
// server/test-only (only API routes + tests import it; no client component does).
// The server wrapper (credits.ts) does the DB I/O.

import { createHash } from "node:crypto";

export type CreditPlan = "single" | "pack5";

/** How many credits each one-time plan grants. The dollar price lives in Stripe. */
export const PLAN_CREDITS: Record<CreditPlan, number> = {
  single: 1,
  pack5: 5,
};

/** Which env var holds each plan's Stripe price id. */
export const PLAN_PRICE_ENV: Record<CreditPlan, string> = {
  single: "STRIPE_PRICE_SINGLE",
  pack5: "STRIPE_PRICE_PACK5",
};

export function isCreditPlan(value: unknown): value is CreditPlan {
  return value === "single" || value === "pack5";
}

export function creditsForPlan(plan: CreditPlan): number {
  return PLAN_CREDITS[plan];
}

/** Balance = sum of all signed deltas. */
export function balanceFromRows(rows: { delta: number }[]): number {
  return rows.reduce((sum, r) => sum + r.delta, 0);
}

/**
 * Stable content fingerprint for a report, so the "one report = one charge" rule
 * holds: the credit spend is keyed to this hash, which covers ONLY the report's
 * content — meta, profile, evidence, and sections. Format (Word vs PDF), style,
 * and re-downloads are deliberately EXCLUDED (only the four fields below feed the
 * hash), so Word then PDF of the same report — or a re-download — debits exactly
 * once. Pure + deterministic, so it unit-tests in node.
 */
// Deterministic, key-order-independent serialization, so the fingerprint depends
// only on report CONTENT, never on the order keys happen to appear in. Today the
// route feeds Zod output (stable key order), but canonicalizing removes that
// hidden precondition: a future caller passing a hand-built object can't silently
// shift the hash and double- or under-charge.
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = canonicalize((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

export function reportFingerprint(data: {
  meta: unknown;
  profile: unknown;
  evidence: unknown;
  sections: unknown;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify(
        canonicalize({
          meta: data.meta,
          profile: data.profile,
          evidence: data.evidence,
          sections: data.sections,
        }),
      ),
    )
    .digest("hex");
}
