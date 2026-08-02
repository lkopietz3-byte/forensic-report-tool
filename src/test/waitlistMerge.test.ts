import { describe, expect, it } from "vitest";
import {
  isDesignPartnerSource,
  mergeWaitlistRecord,
  type WaitlistRecord,
} from "@/lib/waitlist/merge";

const lightweight: WaitlistRecord = {
  email: "expert@practice.com",
  discipline: "vocational_rehabilitation",
  source: "waitlist",
  role: null,
  reports_per_year: null,
  pain_point: null,
  ai_experience: null,
  must_have: null,
  notes: null,
};

describe("mergeWaitlistRecord", () => {
  it("upgrades a lightweight signup with a full design-partner application", () => {
    const merged = mergeWaitlistRecord(lightweight, {
      email: lightweight.email,
      discipline: "forensic_engineering",
      source: "for-experts-forensic_engineering-preview",
      role: "Alex Morgan, P.E.",
      reportsPerYear: "11-25",
      painPoint: "Inspection and citation assembly take too long.",
      mustHave: "Never originate an engineering opinion.",
    });

    expect(merged).toMatchObject({
      discipline: "forensic_engineering",
      source: "for-experts-forensic_engineering-preview",
      role: "Alex Morgan, P.E.",
      reports_per_year: "11-25",
      pain_point: "Inspection and citation assembly take too long.",
      must_have: "Never originate an engineering opinion.",
    });
  });

  it("does not let a later lightweight signup erase application data", () => {
    const application: WaitlistRecord = {
      ...lightweight,
      source: "for-experts-vocational_rehabilitation-preview",
      role: "Dana Whitfield, CRC",
      pain_point: "Records-reviewed assembly takes several hours.",
    };

    const merged = mergeWaitlistRecord(application, {
      email: application.email,
      source: "waitlist",
    });

    expect(merged.source).toBe(
      "for-experts-vocational_rehabilitation-preview",
    );
    expect(merged.role).toBe("Dana Whitfield, CRC");
    expect(merged.pain_point).toBe(
      "Records-reviewed assembly takes several hours.",
    );
  });

  it("lets a repeat application improve individual answers without blanking others", () => {
    const application: WaitlistRecord = {
      ...lightweight,
      source: "for-experts",
      role: "Dana Whitfield, CRC",
      pain_point: "Old answer",
      must_have: "Existing safeguard answer",
    };

    const merged = mergeWaitlistRecord(application, {
      email: application.email,
      source: "for-experts",
      painPoint: "A more specific updated answer",
      mustHave: "   ",
    });

    expect(merged.pain_point).toBe("A more specific updated answer");
    expect(merged.must_have).toBe("Existing safeguard answer");
  });
});

describe("isDesignPartnerSource", () => {
  it("recognizes generic and discipline-preview application sources only", () => {
    expect(isDesignPartnerSource("for-experts")).toBe(true);
    expect(
      isDesignPartnerSource("for-experts-accident_reconstruction-preview"),
    ).toBe(true);
    expect(isDesignPartnerSource("waitlist")).toBe(false);
    expect(isDesignPartnerSource(undefined)).toBe(false);
  });
});
