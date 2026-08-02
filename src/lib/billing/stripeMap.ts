import type { SubscriptionRecord } from "./featureGates";

// Pure Stripe→DB mapping logic, deliberately FREE of `server-only` and the
// Stripe SDK so it unit-tests in the node test runner. The SDK client lives in
// stripe.ts (which re-exports these for route convenience).

/** The DB check-constraint's allowed statuses. */
export type DbSubscriptionStatus = NonNullable<SubscriptionRecord>["status"];

export interface SubscriptionRow {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: DbSubscriptionStatus;
  current_period_end: string | null;
  updated_at: string;
}

/** Minimal shape we depend on, so the mapper isn't coupled to Stripe's types. */
export interface StripeSubLike {
  id: string;
  status: string;
  customer: string | { id: string };
  // Stripe's "Basil" API (2025-03-31+) moved current_period_end OFF the top-level
  // Subscription and onto each subscription item; older versions keep it at the
  // top level. Read the item first and fall back to the top level so the
  // entitlement period-end backstop keeps working across API versions — without
  // this it is always null on a modern account and a lapsed sub grants Pro forever.
  current_period_end?: number | null;
  items?: { data?: Array<{ current_period_end?: number | null }> };
}

/**
 * Coerce any Stripe subscription status into one the subscriptions table's
 * CHECK constraint allows. Stripe has a few statuses our enum doesn't list
 * (unpaid, paused, incomplete_expired); map them to the nearest allowed value
 * so a webhook write never violates the constraint. Tier-granting semantics
 * (deriveTier) only treat active/trialing/past_due as Pro, so these fallbacks
 * are conservative — a paused/unpaid sub does NOT grant Pro.
 */
export function normalizeStripeStatus(status: string): DbSubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
    case "incomplete":
      return status;
    case "unpaid":
      return "past_due";
    case "incomplete_expired":
      return "incomplete";
    case "paused":
    default:
      return "canceled";
  }
}

/** Stripe subscription → a row our service client can upsert. */
export function toSubscriptionRow(
  userId: string,
  sub: StripeSubLike,
  nowIso: string,
): SubscriptionRow {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  // Basil location (items[0]) first, then the legacy top level.
  const periodEndUnix =
    sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end ?? null;
  return {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: normalizeStripeStatus(sub.status),
    current_period_end: periodEndUnix
      ? new Date(periodEndUnix * 1000).toISOString()
      : null,
    updated_at: nowIso,
  };
}
