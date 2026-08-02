import { describe, it, expect, afterEach, vi } from "vitest";
import { checkServerAccess, deriveTier } from "@/lib/billing/featureGates";
import { isBillingEnforced } from "@/lib/flags/featureFlags";

describe("deriveTier period-end backstop", () => {
  const NOW = Date.parse("2026-06-09T00:00:00Z");
  it("grants Pro for an active sub whose period end is in the future", () => {
    expect(deriveTier({ status: "active", currentPeriodEnd: "2026-07-01T00:00:00Z" }, NOW)).toBe("pro");
  });
  it("still grants Pro just past period end (within the webhook/dunning grace)", () => {
    expect(deriveTier({ status: "past_due", currentPeriodEnd: "2026-06-07T00:00:00Z" }, NOW)).toBe("pro");
  });
  it("revokes Pro once period end is well in the past (dropped terminal webhook can't grant forever)", () => {
    expect(deriveTier({ status: "active", currentPeriodEnd: "2026-05-01T00:00:00Z" }, NOW)).toBe("free");
  });
  it("grants Pro when there is no period end recorded (back-compat)", () => {
    expect(deriveTier({ status: "active" }, NOW)).toBe("pro");
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("server gate wiring for persistence + export", () => {
  it("lets an authenticated free user SAVE their own report", () => {
    const d = checkServerAccess("save_report", { authenticated: true, subscription: null });
    expect(d.ok).toBe(true);
  });

  it("blocks an anonymous SAVE with 401 AUTH_REQUIRED", () => {
    const d = checkServerAccess("save_report", { authenticated: false, subscription: null });
    expect(d).toMatchObject({ ok: false, status: 401, code: "AUTH_REQUIRED" });
  });

  it("blocks a free user's EXPORT with 403 PRO_REQUIRED (when enforced)", () => {
    const d = checkServerAccess("docx_export", { authenticated: true, subscription: null });
    expect(d).toMatchObject({ ok: false, status: 403, code: "PRO_REQUIRED" });
  });

  it("lets a Pro user EXPORT", () => {
    const d = checkServerAccess("docx_export", {
      authenticated: true,
      subscription: { status: "active" },
    });
    expect(d.ok).toBe(true);
  });
});

describe("isBillingEnforced (default off so the free demo isn't locked)", () => {
  it("is off by default", () => {
    vi.stubEnv("NEXT_PUBLIC_FF_BILLING", "");
    expect(isBillingEnforced()).toBe(false);
  });

  it("is on only when explicitly enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_FF_BILLING", "1");
    expect(isBillingEnforced()).toBe(true);
  });
});
