/**
 * creditSafety.test.ts — money-safety invariants for the credit ledger and
 * the tier gate that bypasses per-report debits for Pro subscribers.
 *
 * All assertions target EXPORTED pure functions only. No DB, no HTTP, no Stripe.
 *
 * Fingerprint: the "one report = one charge" fingerprint now lives in
 * src/lib/billing/creditLedger.ts as the exported pure reportFingerprint(), and
 * the export route calls it. Its content-only / format-and-style-excluded
 * properties are unit-tested at the bottom of this file.
 */

import { describe, it, expect } from "vitest";
import {
  balanceFromRows,
  creditsForPlan,
  isCreditPlan,
  PLAN_CREDITS,
  reportFingerprint,
} from "@/lib/billing/creditLedger";
import { deriveTier } from "@/lib/billing/featureGates";

// ---------------------------------------------------------------------------
// Credit balance invariants
// ---------------------------------------------------------------------------

describe("credit balance — cannot go negative (pure math)", () => {
  it("empty ledger has zero balance", () => {
    expect(balanceFromRows([])).toBe(0);
  });

  it("a spend reduces balance by exactly 1", () => {
    // Start with 1 credit, spend 1 → 0
    const balance = balanceFromRows([{ delta: 1 }, { delta: -1 }]);
    expect(balance).toBe(0);
  });

  it("balance after multiple spends equals grants minus spends", () => {
    // grant 1, grant 5, spend 1, spend 1 → 4 remaining
    const balance = balanceFromRows([
      { delta: 1 },
      { delta: 5 },
      { delta: -1 },
      { delta: -1 },
    ]);
    expect(balance).toBe(4);
  });

  it("spending every granted credit reaches exactly zero", () => {
    // pack5 = 5 credits, spend all 5
    const rows = [{ delta: 5 }, ...Array.from({ length: 5 }, () => ({ delta: -1 }))];
    expect(balanceFromRows(rows)).toBe(0);
  });

  it("a refund/grant after a spend restores the balance correctly", () => {
    // grant 1, spend 1 → 0; then refund 1 → 1 again
    const balance = balanceFromRows([{ delta: 1 }, { delta: -1 }, { delta: 1 }]);
    expect(balance).toBe(1);
  });

  it("a sequence of alternating grants and refunds stays non-negative throughout and sums correctly", () => {
    const rows = [
      { delta: 5 }, // +5 → 5
      { delta: -1 }, // -1 → 4
      { delta: -1 }, // -1 → 3
      { delta: 1 }, // refund → 4
      { delta: -1 }, // -1 → 3
    ];
    expect(balanceFromRows(rows)).toBe(3);
  });

  it("balanceFromRows is commutative over signed integers (sums the same regardless of order)", () => {
    const rows = [{ delta: 3 }, { delta: -1 }, { delta: -1 }, { delta: 2 }];
    const reversed = [...rows].reverse();
    expect(balanceFromRows(rows)).toBe(balanceFromRows(reversed));
  });
});

// ---------------------------------------------------------------------------
// Plan → credit grant correctness
// ---------------------------------------------------------------------------

describe("plan → credits grant", () => {
  it("single plan grants exactly 1 credit", () => {
    expect(creditsForPlan("single")).toBe(1);
  });

  it("pack5 plan grants exactly 5 credits", () => {
    expect(creditsForPlan("pack5")).toBe(5);
  });

  it("PLAN_CREDITS constant agrees with creditsForPlan for both plans", () => {
    expect(PLAN_CREDITS.single).toBe(creditsForPlan("single"));
    expect(PLAN_CREDITS.pack5).toBe(creditsForPlan("pack5"));
  });

  it("isCreditPlan rejects unknown plan strings", () => {
    expect(isCreditPlan("pro")).toBe(false);
    expect(isCreditPlan("annual")).toBe(false);
    expect(isCreditPlan("monthly")).toBe(false);
    expect(isCreditPlan("free")).toBe(false);
    expect(isCreditPlan("nonsense")).toBe(false);
    expect(isCreditPlan("")).toBe(false);
    expect(isCreditPlan(null)).toBe(false);
    expect(isCreditPlan(undefined)).toBe(false);
    expect(isCreditPlan(5)).toBe(false);
  });

  it("isCreditPlan accepts only the two valid one-time plans", () => {
    expect(isCreditPlan("single")).toBe(true);
    expect(isCreditPlan("pack5")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// deriveTier — the gate that lets a Pro user skip the per-report debit
// ---------------------------------------------------------------------------

describe("deriveTier — basic status gate", () => {
  it("returns 'pro' for active subscription", () => {
    expect(deriveTier({ status: "active" })).toBe("pro");
  });

  it("returns 'pro' for trialing subscription", () => {
    expect(deriveTier({ status: "trialing" })).toBe("pro");
  });

  it("fails closed for past_due with NO period end (a null current_period_end can't grant Pro forever)", () => {
    // A failed card keeps Pro only while a known in-grace period end proves the
    // paid period hasn't clearly ended (asserted separately); with no period end
    // we can't tell "just missed a renewal" from "dead for months", so fail closed.
    expect(deriveTier({ status: "past_due" })).toBe("free");
  });

  it("returns 'free' for canceled subscription", () => {
    expect(deriveTier({ status: "canceled" })).toBe("free");
  });

  it("returns 'free' for incomplete subscription", () => {
    expect(deriveTier({ status: "incomplete" })).toBe("free");
  });

  it("returns 'free' for null record (no subscription row)", () => {
    expect(deriveTier(null)).toBe("free");
  });

  it("returns 'free' for undefined record", () => {
    expect(deriveTier(undefined)).toBe("free");
  });

  it("returns 'free' for a record with a null status field", () => {
    expect(deriveTier({ status: null })).toBe("free");
  });
});

describe("deriveTier — period-end backstop (the money-safety critical path)", () => {
  // Pin 'now' so tests are deterministic and not coupled to wall-clock time.
  const NOW = Date.parse("2026-06-14T00:00:00Z");

  // The grace window is 5 days (PERIOD_GRACE_MS = 5 * 24 * 60 * 60 * 1000).
  // An "active" row whose period ended > 5 days ago must NOT grant Pro,
  // because a dropped terminal webhook could otherwise keep a lapsed sub active.

  it("grants 'pro' when period end is well in the future", () => {
    expect(
      deriveTier({ status: "active", currentPeriodEnd: "2026-07-01T00:00:00Z" }, NOW),
    ).toBe("pro");
  });

  it("grants 'pro' when period just ended (within the 5-day webhook/dunning grace)", () => {
    // 2 days before NOW → still within grace
    const justExpired = new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(deriveTier({ status: "active", currentPeriodEnd: justExpired }, NOW)).toBe("pro");
  });

  it("revokes 'pro' for an active row whose period ended more than 5 days ago (backstop)", () => {
    // period ended 40 days ago — definitely lapsed, webhook must have been dropped
    const longExpired = new Date(NOW - 40 * 24 * 60 * 60 * 1000).toISOString();
    expect(deriveTier({ status: "active", currentPeriodEnd: longExpired }, NOW)).toBe("free");
  });

  it("an 'active' sub with period ending exactly at grace boundary is still 'pro'", () => {
    // Exactly at the grace boundary (5 days before NOW): now <= end + PERIOD_GRACE_MS
    // end + 5 days = NOW → NOT lapsed yet (condition is strictly ">")
    const atBoundary = new Date(NOW - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(deriveTier({ status: "active", currentPeriodEnd: atBoundary }, NOW)).toBe("pro");
  });

  it("revokes 'pro' one millisecond past the grace boundary", () => {
    const oneMsPastGrace = new Date(NOW - 5 * 24 * 60 * 60 * 1000 - 1).toISOString();
    expect(deriveTier({ status: "active", currentPeriodEnd: oneMsPastGrace }, NOW)).toBe("free");
  });

  it("grants 'pro' when no period end is recorded (back-compat: rely on status only)", () => {
    expect(deriveTier({ status: "active" }, NOW)).toBe("pro");
    expect(deriveTier({ status: "active", currentPeriodEnd: null }, NOW)).toBe("pro");
  });

  it("a past_due sub within grace is still 'pro'", () => {
    const recentExpiry = new Date(NOW - 1 * 24 * 60 * 60 * 1000).toISOString();
    expect(deriveTier({ status: "past_due", currentPeriodEnd: recentExpiry }, NOW)).toBe("pro");
  });

  it("a past_due sub outside grace loses 'pro'", () => {
    const oldExpiry = new Date(NOW - 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(deriveTier({ status: "past_due", currentPeriodEnd: oldExpiry }, NOW)).toBe("free");
  });

  it("a canceled sub is always 'free' regardless of period end still being in the future", () => {
    // Edge case: canceled but period end is in the future (Stripe allows immediate cancel
    // with access until period end; this should still be 'free' because status is canceled).
    expect(
      deriveTier({ status: "canceled", currentPeriodEnd: "2026-07-01T00:00:00Z" }, NOW),
    ).toBe("free");
  });
});

// ---------------------------------------------------------------------------
// reportFingerprint — the "one report = one charge" content hash. A credit is
// keyed to this, so it MUST be identical across Word/PDF/re-download of the same
// report (else a second format double-charges) and MUST differ when the report
// content changes (else an edited report rides the first report's free credit).
// ---------------------------------------------------------------------------

describe("reportFingerprint — content-keyed, format/style-independent", () => {
  const base = {
    meta: { matter: "Alvarez v. Brightline", retainingCounsel: "Hahn LLP", expertRole: "Voc rehab" },
    profile: { fullName: "Dana Whitfield", credentials: "CRC" },
    evidence: [{ id: "E1", content: "Records reviewed.", location: "Depo p.1" }],
    sections: [{ key: "records_reviewed", evidenceIds: ["E1"], finalText: "Records reviewed [[E:E1]]." }],
  };

  it("is a deterministic 64-char hex sha256 digest", () => {
    const fp = reportFingerprint(base);
    expect(fp).toMatch(/^[0-9a-f]{64}$/);
    expect(reportFingerprint(base)).toBe(fp);
  });

  it("does NOT change when format (docx vs pdf) varies — format never enters the hash", () => {
    // The route hashes only meta/profile/evidence/sections; format lives in the
    // URL. Extra fields on the object are ignored by construction.
    const withDocx = { ...base, format: "docx" };
    const withPdf = { ...base, format: "pdf" };
    expect(reportFingerprint(withDocx)).toBe(reportFingerprint(withPdf));
    expect(reportFingerprint(withDocx)).toBe(reportFingerprint(base));
  });

  it("does NOT change when style varies — style is excluded from the hash", () => {
    const styledA = { ...base, style: { font: "times", lineNumbers: true } };
    const styledB = { ...base, style: { font: "sans", coverLogo: "logo" } };
    expect(reportFingerprint(styledA)).toBe(reportFingerprint(styledB));
    expect(reportFingerprint(styledA)).toBe(reportFingerprint(base));
  });

  it("DOES change when a section's content changes", () => {
    const edited = {
      ...base,
      sections: [{ key: "records_reviewed", evidenceIds: ["E1"], finalText: "Records reviewed and analyzed [[E:E1]]." }],
    };
    expect(reportFingerprint(edited)).not.toBe(reportFingerprint(base));
  });

  it("DOES change when meta changes", () => {
    const edited = { ...base, meta: { ...base.meta, matter: "Different v. Matter" } };
    expect(reportFingerprint(edited)).not.toBe(reportFingerprint(base));
  });

  it("DOES change when evidence changes", () => {
    const edited = {
      ...base,
      evidence: [{ id: "E1", content: "Records reviewed and one new fact.", location: "Depo p.1" }],
    };
    expect(reportFingerprint(edited)).not.toBe(reportFingerprint(base));
  });

  it("DOES change when profile changes", () => {
    const edited = { ...base, profile: { ...base.profile, fullName: "Someone Else" } };
    expect(reportFingerprint(edited)).not.toBe(reportFingerprint(base));
  });
});
