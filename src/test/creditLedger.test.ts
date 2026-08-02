import { describe, it, expect } from "vitest";
import {
  balanceFromRows,
  creditsForPlan,
  isCreditPlan,
  PLAN_CREDITS,
  PLAN_PRICE_ENV,
  reportFingerprint,
} from "@/lib/billing/creditLedger";

describe("credit ledger math", () => {
  it("balance is the signed sum of deltas", () => {
    expect(balanceFromRows([])).toBe(0);
    expect(balanceFromRows([{ delta: 1 }])).toBe(1); // free signup grant
    expect(balanceFromRows([{ delta: 1 }, { delta: 5 }, { delta: -1 }, { delta: -1 }])).toBe(4);
  });

  it("a fully-spent account reads zero (and the gate would block export)", () => {
    expect(balanceFromRows([{ delta: 1 }, { delta: -1 }])).toBe(0);
  });

  it("maps plans to their credit grant", () => {
    expect(creditsForPlan("single")).toBe(1);
    expect(creditsForPlan("pack5")).toBe(5);
    expect(PLAN_CREDITS).toEqual({ single: 1, pack5: 5 });
  });

  it("recognizes only the one-time credit plans (not the subscription)", () => {
    expect(isCreditPlan("single")).toBe(true);
    expect(isCreditPlan("pack5")).toBe(true);
    expect(isCreditPlan("pro")).toBe(false);
    expect(isCreditPlan("nonsense")).toBe(false);
    expect(isCreditPlan(undefined)).toBe(false);
  });

  it("points each plan at its own price env var", () => {
    expect(PLAN_PRICE_ENV.single).toBe("STRIPE_PRICE_SINGLE");
    expect(PLAN_PRICE_ENV.pack5).toBe("STRIPE_PRICE_PACK5");
  });
});

// The fingerprint is THE idempotency key: the export route reserves a credit keyed
// to it, so "one report = one charge" holds (Word-then-PDF and re-downloads debit
// once). These pin the properties that keep it from double- or under-charging.
const baseReport = () => ({
  meta: { matter: "Alvarez v. Brightline", retainingCounsel: "Doe LLP", expertRole: "Vocational expert" },
  profile: { fullName: "Dr. Pat Vega", credentials: "CRC, ABVE/F" },
  evidence: [
    { id: "e1", content: "FCE limits the plaintiff to sedentary work.", location: "FCE p.3" },
    { id: "e2", content: "Pre-injury wage was $52,000.", location: "W-2 2019" },
  ],
  sections: [
    { key: "opinions", evidenceIds: ["e1", "e2"], finalText: "Sedentary capacity retained [[E:e1]]." },
  ],
});

describe("reportFingerprint — the one-report-one-charge idempotency key", () => {
  it("is a deterministic 64-char sha256: identical content → identical hash", () => {
    expect(reportFingerprint(baseReport())).toBe(reportFingerprint(baseReport()));
    expect(reportFingerprint(baseReport())).toMatch(/^[0-9a-f]{64}$/);
  });

  it("ignores OBJECT KEY ORDER (can't double-charge from a reordered payload)", () => {
    const a = baseReport();
    const reorderedKeys = {
      sections: a.sections.map((s) => ({ finalText: s.finalText, evidenceIds: s.evidenceIds, key: s.key })),
      evidence: a.evidence.map((u) => ({ location: u.location, content: u.content, id: u.id })),
      profile: { credentials: a.profile.credentials, fullName: a.profile.fullName },
      meta: { expertRole: a.meta.expertRole, retainingCounsel: a.meta.retainingCounsel, matter: a.meta.matter },
    };
    expect(reportFingerprint(reorderedKeys)).toBe(reportFingerprint(a));
  });

  it("excludes format / style / download count — only the four content fields feed the hash", () => {
    const a = baseReport();
    const withNoise = { ...a, style: { font: "Century" }, format: "pdf", downloadCount: 7 };
    expect(reportFingerprint(withNoise)).toBe(reportFingerprint(a));
  });

  it("changes when the matter changes", () => {
    const a = baseReport();
    expect(reportFingerprint({ ...a, meta: { ...a.meta, matter: "Smith v. Jones" } })).not.toBe(
      reportFingerprint(a),
    );
  });

  it("changes when a section's adopted text is edited (an edit is a new report version)", () => {
    const a = baseReport();
    const edited = { ...a, sections: [{ ...a.sections[0]!, finalText: "Totally unemployable [[E:e1]]." }] };
    expect(reportFingerprint(edited)).not.toBe(reportFingerprint(a));
  });

  it("changes when evidence content changes, or a unit/section is added or removed", () => {
    const a = baseReport();
    const changedEvidence = { ...a, evidence: [{ ...a.evidence[0]!, content: "Different finding." }, a.evidence[1]!] };
    const fewerEvidence = { ...a, evidence: [a.evidence[0]!] };
    const moreSections = {
      ...a,
      sections: [...a.sections, { key: "bases_and_reasons", evidenceIds: ["e1"], finalText: "Basis [[E:e1]]." }],
    };
    expect(reportFingerprint(changedEvidence)).not.toBe(reportFingerprint(a));
    expect(reportFingerprint(fewerEvidence)).not.toBe(reportFingerprint(a));
    expect(reportFingerprint(moreSections)).not.toBe(reportFingerprint(a));
  });

  it("treats a pure EVIDENCE REORDER as a different report (current behavior — confirm intent)", () => {
    // canonicalize sorts object keys but PRESERVES array order, so reordering the
    // evidence list changes the hash → a reordered re-export would be a NEW charge.
    // Pinning current behavior: if reorder should not re-charge, sort evidence by id.
    const a = baseReport();
    const reordered = { ...a, evidence: [a.evidence[1]!, a.evidence[0]!] };
    expect(reportFingerprint(reordered)).not.toBe(reportFingerprint(a));
  });
});
