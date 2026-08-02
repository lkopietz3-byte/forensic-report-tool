import { describe, expect, it } from "vitest";
import {
  designPartnerQualityIssue,
  parseWaitlistInput,
  waitlistInputSchema,
} from "@/lib/waitlist/schema";

function gate(raw: unknown): string | null {
  return designPartnerQualityIssue(waitlistInputSchema.parse(raw));
}

describe("parseWaitlistInput", () => {
  it("accepts a valid email and normalizes it", () => {
    const r = parseWaitlistInput({ email: "  Expert@Practice.COM " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("expert@practice.com");
  });

  it("rejects a malformed email", () => {
    expect(parseWaitlistInput({ email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a missing email", () => {
    expect(parseWaitlistInput({}).success).toBe(false);
  });

  it("accepts a known discipline", () => {
    const r = parseWaitlistInput({
      email: "a@b.com",
      discipline: "vocational_rehabilitation",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.discipline).toBe("vocational_rehabilitation");
  });

  it("rejects an unknown discipline", () => {
    expect(
      parseWaitlistInput({ email: "a@b.com", discipline: "astrology" }).success,
    ).toBe(false);
  });

  it("accepts a filled honeypot at the schema level (the route fakes success, not a 400)", () => {
    // Rejecting here would 400 and signal the bot that something tripped. The
    // schema accepts a bounded value; the route detects parsed.data.company and
    // returns a fake success while persisting nothing.
    const r = parseWaitlistInput({ email: "a@b.com", company: "Acme" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.company).toBe("Acme");
  });

  it("still bounds the honeypot value (no unbounded payload)", () => {
    expect(
      parseWaitlistInput({ email: "a@b.com", company: "x".repeat(201) }).success,
    ).toBe(false);
  });

  it("allows an empty honeypot and optional source", () => {
    const r = parseWaitlistInput({
      email: "a@b.com",
      company: "",
      source: "waitlist-hero",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.source).toBe("waitlist-hero");
  });
});

describe("parseWaitlistInput — async-discovery fields (/for-experts)", () => {
  it("accepts the optional role / reportsPerYear / notes fields", () => {
    const r = parseWaitlistInput({
      email: "dana@practice.com",
      role: "Dana Whitfield, CRC, ABVE/D",
      reportsPerYear: "4-10",
      notes: "Writing the records-reviewed section is the worst part.",
      source: "for-experts",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.reportsPerYear).toBe("4-10");
      expect(r.data.role).toBe("Dana Whitfield, CRC, ABVE/D");
    }
  });

  it("rejects an out-of-range reports-per-year value", () => {
    expect(
      parseWaitlistInput({ email: "a@b.com", reportsPerYear: "a lot" }).success,
    ).toBe(false);
  });

  it("rejects an over-long notes field", () => {
    expect(
      parseWaitlistInput({ email: "a@b.com", notes: "x".repeat(2001) }).success,
    ).toBe(false);
  });

  it("accepts a filled honeypot alongside the new fields (route trips it, not the schema)", () => {
    const r = parseWaitlistInput({ email: "a@b.com", role: "X", company: "bot" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.company).toBe("bot");
  });
});

describe("designPartnerQualityIssue (the /for-experts quality gate)", () => {
  const base = {
    email: "dana@practice.com",
    source: "for-experts",
    discipline: "vocational_rehabilitation",
  };

  it("passes a substantive application (discipline + 2 real answers)", () => {
    expect(
      gate({
        ...base,
        painPoint: "Assembling the records-reviewed section by hand takes hours.",
        mustHave: "It can never invent a citation I didn't give it.",
      }),
    ).toBeNull();
  });

  it("applies the quality gate to attributed discipline-preview sources", () => {
    expect(
      gate({
        ...base,
        source: "for-experts-forensic_engineering-preview",
        painPoint: "Assembling inspection records into a clear report takes hours.",
        mustHave: "The tool must preserve my methods and never invent an opinion.",
      }),
    ).toBeNull();
    expect(
      gate({
        ...base,
        source: "for-experts-accident_reconstruction-preview",
        painPoint: "time",
      }),
    ).toMatch(/tell us a bit more/i);
  });

  it("rejects a blank or one-word application", () => {
    expect(gate({ ...base, painPoint: "time" })).toMatch(/tell us a bit more/i);
    expect(gate({ ...base })).toMatch(/tell us a bit more/i);
  });

  it("requires a discipline", () => {
    expect(
      gate({
        email: "a@b.com",
        source: "for-experts",
        painPoint: "Writing the analysis section is the slow part for me always.",
        mustHave: "Must keep me as the author and never fabricate anything at all.",
      }),
    ).toMatch(/discipline/i);
  });

  it("exempts the plain waitlist signup (no source / other source)", () => {
    expect(gate({ email: "a@b.com" })).toBeNull();
    expect(gate({ email: "a@b.com", source: "waitlist-hero" })).toBeNull();
  });

  it("accepts the three structured discovery fields at the schema level", () => {
    const r = parseWaitlistInput({
      email: "a@b.com",
      painPoint: "x",
      aiExperience: "y",
      mustHave: "z",
      source: "for-experts",
    });
    expect(r.success).toBe(true);
  });
});
