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
 * MONEY-SAFETY guard for a Stripe `checkout.session.completed` event: how many
 * credits (if any) it should grant. Returns 0 — grant NOTHING — unless the session
 * is a one-time PAYMENT that actually settled (`payment_status === "paid"`) and
 * carries a positive, finite credit count in its metadata. This closes the
 * free-credit leak where `checkout.session.completed` also fires for unpaid or
 * delayed-payment sessions, ignores subscription sessions (Pro is mirrored
 * separately), and rejects missing or garbage metadata. Pure, so it unit-tests
 * without Stripe.
 */
export function creditGrantForSession(session: {
  mode?: string | null;
  payment_status?: string | null;
  metadata?: Record<string, string> | null;
}): number {
  if (session.mode !== "payment") return 0;
  if (session.payment_status !== "paid") return 0;
  const credits = Number(session.metadata?.credits ?? "0");
  if (!Number.isFinite(credits) || credits <= 0) return 0;
  return credits;
}

/**
 * Outcome of a credit spend. `debited` = a credit was taken this call;
 * `already_paid` = this report content was already paid for (an idempotent
 * Word-then-PDF re-export), nothing debited; `insufficient` = out of credits;
 * `unavailable` = the ledger couldn't be reached OR returned an unexpected shape.
 * Only a `debited` result may be refunded on a later render failure.
 */
export type SpendResult = "debited" | "already_paid" | "insufficient" | "unavailable";

/**
 * Map the `spend_credit` RPC's raw return into a SpendResult. Per migration 0013
 * the function returns text ('debited' | 'already_paid' | 'insufficient'). Anything
 * else — a BOOLEAN (if 0013 was skipped and the old boolean-returning function is
 * still live in prod), null, or an unexpected value — becomes "unavailable", so the
 * caller fails CLOSED (no credit spent, a 503) rather than mistaking a truthy
 * boolean for a successful debit and shipping a paid deliverable for free.
 */
export function normalizeSpendResult(data: unknown): SpendResult {
  return data === "debited" || data === "already_paid" || data === "insufficient"
    ? data
    : "unavailable";
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
