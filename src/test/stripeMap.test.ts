import { describe, it, expect } from "vitest";
import {
  normalizeStripeStatus,
  toSubscriptionRow,
  type StripeSubLike,
} from "@/lib/billing/stripeMap";
import { deriveTier } from "@/lib/billing/featureGates";

describe("normalizeStripeStatus → DB-constraint-safe values", () => {
  it("passes through the statuses our enum already allows", () => {
    for (const s of ["active", "trialing", "past_due", "canceled", "incomplete"] as const) {
      expect(normalizeStripeStatus(s)).toBe(s);
    }
  });

  it("maps Stripe statuses our enum lacks to the nearest allowed value", () => {
    expect(normalizeStripeStatus("unpaid")).toBe("past_due");
    expect(normalizeStripeStatus("incomplete_expired")).toBe("incomplete");
    expect(normalizeStripeStatus("paused")).toBe("canceled");
    expect(normalizeStripeStatus("something_new")).toBe("canceled");
  });
});

describe("toSubscriptionRow", () => {
  const NOW = "2026-06-09T00:00:00.000Z";

  it("builds a row from a Stripe subscription (string customer)", () => {
    const sub: StripeSubLike = {
      id: "sub_123",
      status: "active",
      customer: "cus_abc",
      current_period_end: 1772841600, // 2026-03-07T00:00:00Z
    };
    const row = toSubscriptionRow("user-1", sub, NOW);
    expect(row).toEqual({
      user_id: "user-1",
      stripe_customer_id: "cus_abc",
      stripe_subscription_id: "sub_123",
      status: "active",
      current_period_end: new Date(1772841600 * 1000).toISOString(),
      updated_at: NOW,
    });
  });

  it("reads current_period_end from items[0] (Stripe Basil API) when the top level is absent", () => {
    // Basil (2025-03-31+) moved current_period_end off the top-level Subscription
    // onto each item. Without reading it here the mapped row is null and a lapsed
    // sub grants Pro forever.
    const sub: StripeSubLike = {
      id: "sub_basil",
      status: "active",
      customer: "cus_basil",
      items: { data: [{ current_period_end: 1772841600 }] },
    };
    const row = toSubscriptionRow("user-b", sub, NOW);
    expect(row.current_period_end).toBe(new Date(1772841600 * 1000).toISOString());
  });

  it("handles an expanded customer object and a missing period end", () => {
    const sub: StripeSubLike = {
      id: "sub_9",
      status: "canceled",
      customer: { id: "cus_xyz" },
      current_period_end: null,
    };
    const row = toSubscriptionRow("user-2", sub, NOW);
    expect(row.stripe_customer_id).toBe("cus_xyz");
    expect(row.current_period_end).toBeNull();
    expect(row.status).toBe("canceled");
  });

  it("an active mapped row grants Pro; a canceled one does not (end to end through deriveTier)", () => {
    const active = toSubscriptionRow("u", { id: "s", status: "active", customer: "c" }, NOW);
    const dead = toSubscriptionRow("u", { id: "s", status: "paused", customer: "c" }, NOW);
    expect(deriveTier({ status: active.status })).toBe("pro");
    expect(deriveTier({ status: dead.status })).toBe("free");
  });
});
