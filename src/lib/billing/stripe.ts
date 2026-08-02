import "server-only";
import Stripe from "stripe";
import { PLAN_PRICE_ENV, type CreditPlan } from "./creditLedger";
import { isBillingEnforced } from "../flags/featureFlags";
import { supabaseServiceConfigured } from "../supabase/config";
import { log } from "../log/logger";

// Lazy Stripe wiring. Like the rest of the app, billing is fail-open in
// preview: with no STRIPE_SECRET_KEY the client is null and every billing path
// degrades to "not available" instead of throwing. Pure mapping logic lives in
// stripeMap.ts (server-only-free so it unit-tests); re-exported here for routes.

export {
  normalizeStripeStatus,
  toSubscriptionRow,
  type DbSubscriptionStatus,
  type SubscriptionRow,
  type StripeSubLike,
} from "./stripeMap";

let cached: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe | null {
  if (!stripeConfigured()) return null;
  if (!cached) {
    // apiVersion omitted on purpose: use the version pinned to the account, so
    // a types bump here can't desync from the dashboard.
    cached = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return cached;
}

/** The one-time price id for a credit plan (single / 5-pack), or null if unset. */
export function planPriceId(plan: CreditPlan): string | null {
  return process.env[PLAN_PRICE_ENV[plan]]?.trim() || null;
}

/** Whether at least one credit plan is purchasable (price configured). */
export function creditsPurchasable(): boolean {
  return Boolean(planPriceId("single") || planPriceId("pack5"));
}

let warnedBillingMisconfig = false;

/**
 * Whether billing is actually LIVE end-to-end: the enforcement flag is on AND
 * both prerequisites exist — a Stripe key (so we can charge) and a Supabase
 * service-role key (so we can read and debit credits). This is the SINGLE gate
 * shared by the sell UI, the checkout route, and the export debit, so they can
 * never disagree. Decoupling them was the top go-live money bug: flag-on-but-
 * keys-missing is a permanent 402 on the first free report, and Stripe-on-but-
 * flag-off charges while metering nothing. On an inconsistent config we fail
 * SAFE (billing not live: exports stay free, sell UI hidden) and warn once.
 */
export function isBillingLive(): boolean {
  const flag = isBillingEnforced();
  const stripe = stripeConfigured();
  const serviceRole = supabaseServiceConfigured();
  const live = flag && stripe && serviceRole;
  if (!warnedBillingMisconfig) {
    if (flag && !live) {
      warnedBillingMisconfig = true;
      log.warn("billing.misconfigured", {
        detail: `NEXT_PUBLIC_FF_BILLING is on but ${!stripe ? "STRIPE_SECRET_KEY " : ""}${!serviceRole ? "SUPABASE_SERVICE_ROLE_KEY " : ""}is missing — billing is NOT enforced (exports stay free) so no one is locked out. Set the missing key or turn the flag off.`,
      });
    } else if (stripe && !flag) {
      warnedBillingMisconfig = true;
      log.warn("billing.misconfigured", {
        detail: "STRIPE_SECRET_KEY is set but NEXT_PUBLIC_FF_BILLING is off — checkout could charge while exports stay free. Enable the flag (with the service-role key) or remove the Stripe key.",
      });
    }
  }
  return live;
}
