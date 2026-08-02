import { describe, expect, it } from "vitest";
import {
  canAccess,
  checkServerAccess,
  deriveTier,
} from "../lib/billing/featureGates.js";

describe("deriveTier", () => {
  it("treats active/trialing as pro; past_due needs a known in-grace period end", () => {
    expect(deriveTier({ status: "active" })).toBe("pro");
    expect(deriveTier({ status: "trialing" })).toBe("pro");
    // past_due (a failed card) keeps Pro ONLY while a known period end proves the
    // paid period hasn't clearly ended, so a mid-export deliverable isn't revoked
    // on one missed charge. With NO period end we fail closed — otherwise a null
    // current_period_end (the Stripe "Basil" API moved it off the top level)
    // would grant Pro forever to a long-dead subscription.
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(deriveTier({ status: "past_due", currentPeriodEnd: soon })).toBe("pro");
    expect(deriveTier({ status: "past_due" })).toBe("free");
  });

  it("treats no record, canceled, or incomplete as free (fail-closed)", () => {
    expect(deriveTier(null)).toBe("free");
    expect(deriveTier(undefined)).toBe("free");
    expect(deriveTier({ status: "canceled" })).toBe("free");
    expect(deriveTier({ status: "incomplete" })).toBe("free");
    expect(deriveTier({ status: null })).toBe("free");
  });
});

describe("checkServerAccess", () => {
  it("401s an unauthenticated caller before any tier check", () => {
    const d = checkServerAccess("docx_export", {
      authenticated: false,
      subscription: { status: "active" },
    });
    expect(d).toEqual({
      ok: false,
      status: 401,
      code: "AUTH_REQUIRED",
      feature: "docx_export",
    });
  });

  it("403s an authenticated free caller on a gated deliverable", () => {
    const d = checkServerAccess("docx_export", {
      authenticated: true,
      subscription: null,
    });
    expect(d).toEqual({
      ok: false,
      status: 403,
      code: "PRO_REQUIRED",
      feature: "docx_export",
    });
  });

  it("allows a pro caller through the gate", () => {
    const d = checkServerAccess("full_disclosure_appendix", {
      authenticated: true,
      subscription: { status: "active" },
    });
    expect(d).toEqual({ ok: true, tier: "pro" });
  });

  it("allows a free caller a non-gated feature once authenticated", () => {
    const d = checkServerAccess("intake", {
      authenticated: true,
      subscription: null,
    });
    expect(d).toEqual({ ok: true, tier: "free" });
  });

  it("agrees with canAccess for the derived tier", () => {
    expect(canAccess("docx_export", deriveTier({ status: "active" }))).toBe(true);
    expect(canAccess("docx_export", deriveTier(null))).toBe(false);
  });
});
