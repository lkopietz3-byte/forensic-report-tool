/**
 * reportSchema.test.ts
 *
 * Hardening tests for the attacker-controlled input surface of parseReportInput /
 * reportInputSchema. Every assertion is grounded in the ACTUAL Zod schema in
 * src/lib/report/schema.ts — no guessed behavior.
 *
 * Gap notes (genuine schema weaknesses, not invented assertions) are marked GAP.
 */

import { describe, expect, it } from "vitest";
import { parseReportInput } from "../lib/report/schema.js";
import { MAX_UNITS } from "../lib/draft/extract.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A tiny valid 1×1 PNG as a data URL (11 bytes of actual PNG data). */
const TINY_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

/** Build a minimal valid payload — the baseline for all tests. */
function minimalValid(): Record<string, unknown> {
  return {
    meta: { matter: "Smith v. Jones, No. 24-cv-1234" },
    profile: { fullName: "Dr. Jane Expert, CRC" },
    evidence: [
      { id: "e1", content: "Claimant was injured on 1 Jan 2022.", location: "Medical records p.1" },
    ],
    sections: [{ key: "scope_of_assignment" }],
  };
}

// ---------------------------------------------------------------------------
// 1. Minimal valid input
// ---------------------------------------------------------------------------

describe("parseReportInput — minimal valid input", () => {
  it("accepts a minimal well-formed payload", () => {
    const r = parseReportInput(minimalValid());
    expect(r.success).toBe(true);
  });

  it("applies Zod defaults (retainingCounsel, credentials, etc.)", () => {
    const r = parseReportInput(minimalValid());
    if (!r.success) throw new Error("expected success");
    expect(r.data.meta.retainingCounsel).toBe("");
    expect(r.data.profile.credentials).toBe("");
    expect(r.data.profile.publicationsLast10yr).toEqual([]);
    expect(r.data.profile.priorTestimonyLast4yr).toEqual([]);
    expect(r.data.profile.compensationStatement).toBe("");
    expect(r.data.sections[0].evidenceIds).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. imageData — PNG cap enforcement
// ---------------------------------------------------------------------------

describe("EvidenceSchema.imageData — PNG cap (800 000 chars)", () => {
  it("accepts a valid tiny 1×1 PNG data URL", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [
        {
          id: "img1",
          content: "Figure: site photograph.",
          location: "Photograph 1",
          imageData: TINY_PNG_DATA_URL,
        },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("rejects imageData longer than 800 000 characters", () => {
    // Build a data URL whose total length is 800_001 chars. The prefix is
    // "data:image/png;base64," (22 chars) so we need 800_001 - 22 chars of
    // base64 payload, but Zod's .max() counts the full string length.
    const prefix = "data:image/png;base64,";
    // Use only valid base64 chars so the regex check doesn't fire first.
    const payload = "A".repeat(800_001 - prefix.length);
    const oversized = prefix + payload;
    expect(oversized.length).toBe(800_001);

    const r = parseReportInput({
      ...minimalValid(),
      evidence: [{ id: "img1", content: "A.", location: "p.1", imageData: oversized }],
    });
    expect(r.success).toBe(false);
  });

  it("accepts imageData at exactly the cap (800 000 chars)", () => {
    const prefix = "data:image/png;base64,";
    const payload = "A".repeat(800_000 - prefix.length);
    const atLimit = prefix + payload;
    expect(atLimit.length).toBe(800_000);

    const r = parseReportInput({
      ...minimalValid(),
      evidence: [{ id: "img1", content: "A.", location: "p.1", imageData: atLimit }],
    });
    expect(r.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. imageData — format / scheme enforcement
// ---------------------------------------------------------------------------

describe("EvidenceSchema.imageData — format / scheme enforcement", () => {
  it("rejects a JPEG data URL", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [
        {
          id: "img1",
          content: "A.",
          location: "p.1",
          imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgAB",
        },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("rejects a WebP data URL", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [
        {
          id: "img1",
          content: "A.",
          location: "p.1",
          imageData: "data:image/webp;base64,UklGRlYAAABXRUJQ",
        },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("rejects a javascript: URL", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [
        { id: "img1", content: "A.", location: "p.1", imageData: "javascript:alert(1)" },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("rejects an http: URL", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [
        {
          id: "img1",
          content: "A.",
          location: "p.1",
          imageData: "http://evil.example.com/pixel.png",
        },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("rejects a data: URL with a smuggled SVG (XSS vector)", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [
        {
          id: "img1",
          content: "A.",
          location: "p.1",
          imageData: "data:image/svg+xml;base64,PHN2ZyB4bWxuczp4bGluaz0naHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayc+",
        },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("rejects a plain PNG URL (not a data URL)", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [
        {
          id: "img1",
          content: "A.",
          location: "p.1",
          imageData: "https://cdn.example.com/image.png",
        },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("rejects an empty string imageData (not a valid PNG data URL)", () => {
    // Empty string does not match the PNG regex.
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [{ id: "img1", content: "A.", location: "p.1", imageData: "" }],
    });
    expect(r.success).toBe(false);
  });

  it("accepts undefined/absent imageData (field is optional)", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [{ id: "e1", content: "A.", location: "p.1" }],
    });
    expect(r.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Evidence field length limits
// ---------------------------------------------------------------------------

describe("EvidenceSchema — field length limits", () => {
  it("rejects content longer than 2 000 characters", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [{ id: "e1", content: "x".repeat(2_001), location: "p.1" }],
    });
    expect(r.success).toBe(false);
  });

  it("accepts content at exactly 2 000 characters", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [{ id: "e1", content: "x".repeat(2_000), location: "p.1" }],
    });
    expect(r.success).toBe(true);
  });

  it("rejects location longer than 160 characters", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [{ id: "e1", content: "A.", location: "x".repeat(161) }],
    });
    expect(r.success).toBe(false);
  });

  it("accepts location at exactly 160 characters", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [{ id: "e1", content: "A.", location: "x".repeat(160) }],
    });
    expect(r.success).toBe(true);
  });

  it("rejects an evidence id longer than 64 characters", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [{ id: "x".repeat(65), content: "A.", location: "p.1" }],
    });
    expect(r.success).toBe(false);
  });

  it("rejects an evidence id with characters outside [a-zA-Z0-9_-]", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [{ id: "evidence!", content: "A.", location: "p.1" }],
    });
    expect(r.success).toBe(false);
  });

  it("rejects content that is only whitespace (min(1) after trim)", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [{ id: "e1", content: "   ", location: "p.1" }],
    });
    expect(r.success).toBe(false);
  });

  it("rejects location that is only whitespace (min(1) after trim)", () => {
    const r = parseReportInput({
      ...minimalValid(),
      evidence: [{ id: "e1", content: "A.", location: "   " }],
    });
    expect(r.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Evidence array cap (MAX_UNITS)
// ---------------------------------------------------------------------------

describe("evidence array cap (MAX_UNITS = 40)", () => {
  it("rejects evidence arrays longer than MAX_UNITS", () => {
    const evidence = Array.from({ length: MAX_UNITS + 1 }, (_, i) => ({
      id: `e${i}`,
      content: "A fact.",
      location: "p.1",
    }));
    const r = parseReportInput({ ...minimalValid(), evidence });
    expect(r.success).toBe(false);
  });

  it("accepts evidence arrays at exactly MAX_UNITS", () => {
    const evidence = Array.from({ length: MAX_UNITS }, (_, i) => ({
      id: `e${i}`,
      content: "A fact.",
      location: "p.1",
    }));
    const r = parseReportInput({ ...minimalValid(), evidence });
    expect(r.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. Required meta / profile fields
// ---------------------------------------------------------------------------

describe("meta — required fields", () => {
  it("rejects a missing meta.matter", () => {
    const r = parseReportInput({
      ...minimalValid(),
      meta: { retainingCounsel: "Atty. Brown" }, // matter absent
    });
    expect(r.success).toBe(false);
  });

  it("rejects an empty meta.matter (min(1) after trim)", () => {
    const r = parseReportInput({ ...minimalValid(), meta: { matter: "   " } });
    expect(r.success).toBe(false);
  });

  it("rejects meta.matter longer than 200 characters", () => {
    const r = parseReportInput({
      ...minimalValid(),
      meta: { matter: "x".repeat(201) },
    });
    expect(r.success).toBe(false);
  });

  it("rejects a completely absent meta object", () => {
    const payload = minimalValid() as Record<string, unknown>;
    delete payload.meta;
    expect(parseReportInput(payload).success).toBe(false);
  });
});

describe("profile — required fields", () => {
  it("rejects a missing profile.fullName", () => {
    const r = parseReportInput({
      ...minimalValid(),
      profile: { credentials: "CRC" }, // fullName absent
    });
    expect(r.success).toBe(false);
  });

  it("rejects an empty profile.fullName (min(1) after trim)", () => {
    const r = parseReportInput({
      ...minimalValid(),
      profile: { fullName: "  " },
    });
    expect(r.success).toBe(false);
  });

  it("rejects profile.fullName longer than 160 characters", () => {
    const r = parseReportInput({
      ...minimalValid(),
      profile: { fullName: "x".repeat(161) },
    });
    expect(r.success).toBe(false);
  });

  it("rejects a completely absent profile object", () => {
    const payload = minimalValid() as Record<string, unknown>;
    delete payload.profile;
    expect(parseReportInput(payload).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 7. StyleSchema — font enum enforcement
// ---------------------------------------------------------------------------

describe("StyleSchema — font enum", () => {
  it("accepts all valid font values", () => {
    for (const font of ["default", "times", "sans", "century"] as const) {
      const r = parseReportInput({ ...minimalValid(), style: { font } });
      expect(r.success, `font '${font}' should be valid`).toBe(true);
    }
  });

  it("rejects an invalid font value (comic-sans)", () => {
    const r = parseReportInput({ ...minimalValid(), style: { font: "comic-sans" } });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid font value (Arial)", () => {
    const r = parseReportInput({ ...minimalValid(), style: { font: "Arial" } });
    expect(r.success).toBe(false);
  });

  it("accepts an absent style object (entirely optional)", () => {
    const payload = minimalValid() as Record<string, unknown>;
    delete payload.style;
    expect(parseReportInput(payload).success).toBe(true);
  });

  it("accepts an explicitly null-valued style field (optional)", () => {
    // StyleSchema is z.object({...}).optional() — undefined is fine; null is not
    // a valid Zod optional value. Assert the real behavior.
    const r = parseReportInput({ ...minimalValid(), style: null });
    // Zod .optional() does NOT accept null — this should fail.
    expect(r.success).toBe(false);
  });
});

describe("StyleSchema — fontSizePt literal union", () => {
  it("accepts 11 and 12", () => {
    expect(parseReportInput({ ...minimalValid(), style: { fontSizePt: 11 } }).success).toBe(true);
    expect(parseReportInput({ ...minimalValid(), style: { fontSizePt: 12 } }).success).toBe(true);
  });

  it("rejects 10 (not in literal union)", () => {
    expect(parseReportInput({ ...minimalValid(), style: { fontSizePt: 10 } }).success).toBe(false);
  });

  it("rejects 14 (not in literal union)", () => {
    expect(parseReportInput({ ...minimalValid(), style: { fontSizePt: 14 } }).success).toBe(false);
  });
});

describe("StyleSchema — lineSpacing / headingNumbering enums", () => {
  it("rejects invalid lineSpacing value", () => {
    const r = parseReportInput({ ...minimalValid(), style: { lineSpacing: "triple" } });
    expect(r.success).toBe(false);
  });

  it("rejects invalid headingNumbering value", () => {
    const r = parseReportInput({ ...minimalValid(), style: { headingNumbering: "alphabetic" } });
    expect(r.success).toBe(false);
  });
});

describe("StyleSchema — footerText and reportDate bounds", () => {
  it("rejects footerText longer than 120 characters", () => {
    const r = parseReportInput({ ...minimalValid(), style: { footerText: "x".repeat(121) } });
    expect(r.success).toBe(false);
  });

  it("accepts footerText at exactly 120 characters", () => {
    const r = parseReportInput({ ...minimalValid(), style: { footerText: "x".repeat(120) } });
    expect(r.success).toBe(true);
  });

  it("rejects reportDate longer than 60 characters", () => {
    const r = parseReportInput({ ...minimalValid(), style: { reportDate: "x".repeat(61) } });
    expect(r.success).toBe(false);
  });

  // reportDate is restricted to date-plausible characters, so injection-shaped
  // payloads are rejected at the schema boundary before they reach the exporter's
  // cover page. (Previously this was an accepted GAP — now hardened.)
  it("rejects an injection-shaped reportDate (javascript:/SQL/angle brackets)", () => {
    for (const bad of [
      "javascript:alert(1)",
      "'; DROP TABLE foo; --",
      "<script>alert(1)</script>",
      "June 14, 2026 (see note)",
    ]) {
      const r = parseReportInput({ ...minimalValid(), style: { reportDate: bad } });
      expect(r.success, `expected ${JSON.stringify(bad)} to be rejected`).toBe(false);
    }
  });

  it("accepts plausible date formats in reportDate", () => {
    for (const ok of ["", "2026-06-14", "June 14, 2026", "14 June 2026", "06/14/2026", "June 2026"]) {
      const r = parseReportInput({ ...minimalValid(), style: { reportDate: ok } });
      expect(r.success, `expected ${JSON.stringify(ok)} to be accepted`).toBe(true);
    }
  });
});

describe("StyleSchema — coverLogo", () => {
  it("rejects coverLogo longer than 600 000 characters", () => {
    const prefix = "data:image/png;base64,";
    const oversized = prefix + "A".repeat(600_001 - prefix.length);
    expect(oversized.length).toBe(600_001);
    const r = parseReportInput({ ...minimalValid(), style: { coverLogo: oversized } });
    expect(r.success).toBe(false);
  });

  it("accepts an empty string coverLogo (schema allows it via ^$ alternate)", () => {
    const r = parseReportInput({ ...minimalValid(), style: { coverLogo: "" } });
    expect(r.success).toBe(true);
  });

  it("rejects a non-PNG data URL in coverLogo", () => {
    const r = parseReportInput({
      ...minimalValid(),
      style: { coverLogo: "data:image/jpeg;base64,/9j/4AAQ" },
    });
    expect(r.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 8. Section key enforcement
// ---------------------------------------------------------------------------

describe("SectionSchema — key enforcement", () => {
  it("accepts all known VOCREHAB_TEMPLATE section keys", () => {
    const validKeys = [
      "scope_of_assignment",
      "summary_of_opinions",
      "background",
      "records_reviewed",
      "interview",
      "vocational_testing",
      "functional_capacity",
      "transferable_skills",
      "labor_market_survey",
      "rehabilitation_plan",
      "earning_capacity",
      "labor_force_participation",
      "loss_of_earning_capacity",
      "opinions",
      "basis_and_reasons",
      "facts_or_data_considered",
      "exhibits",
      "qualifications",
      "prior_testimony",
      "compensation",
    ];
    const r = parseReportInput({
      ...minimalValid(),
      sections: validKeys.map((key) => ({ key })),
    });
    expect(r.success).toBe(true);
  });

  it("rejects an unknown section key", () => {
    const r = parseReportInput({
      ...minimalValid(),
      sections: [{ key: "unknown_section" }],
    });
    expect(r.success).toBe(false);
  });

  it("rejects an empty sections array (min(1))", () => {
    const r = parseReportInput({ ...minimalValid(), sections: [] });
    expect(r.success).toBe(false);
  });

  it("rejects more than 30 sections", () => {
    // VOCREHAB_TEMPLATE has 20 keys; we need to repeat some to reach 31.
    const sections = Array.from({ length: 31 }, () => ({ key: "scope_of_assignment" }));
    const r = parseReportInput({ ...minimalValid(), sections });
    expect(r.success).toBe(false);
  });

  it("rejects a missing sections array", () => {
    const payload = minimalValid() as Record<string, unknown>;
    delete payload.sections;
    expect(parseReportInput(payload).success).toBe(false);
  });

  it("rejects finalText longer than 20 000 characters", () => {
    const r = parseReportInput({
      ...minimalValid(),
      sections: [{ key: "scope_of_assignment", finalText: "x".repeat(20_001) }],
    });
    expect(r.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9. Large-but-valid input (load / DoS surface)
// ---------------------------------------------------------------------------

describe("large but valid input", () => {
  it("parses a payload with MAX_UNITS evidence and all 20 section keys without error", () => {
    const evidence = Array.from({ length: MAX_UNITS }, (_, i) => ({
      id: `e${i}`,
      content: "The claimant demonstrated measurable functional limitations per the FCE.".padEnd(2_000, " ").trimEnd(),
      location: `FCE report p.${i + 1}`,
    }));
    const sections = [
      "scope_of_assignment",
      "summary_of_opinions",
      "background",
      "records_reviewed",
      "interview",
      "vocational_testing",
      "functional_capacity",
      "transferable_skills",
      "labor_market_survey",
      "rehabilitation_plan",
      "earning_capacity",
      "labor_force_participation",
      "loss_of_earning_capacity",
      "opinions",
      "basis_and_reasons",
      "facts_or_data_considered",
      "exhibits",
      "qualifications",
      "prior_testimony",
      "compensation",
    ].map((key, i) => ({
      key,
      evidenceIds: [`e${i % MAX_UNITS}`],
      finalText: "Expert analysis text goes here.",
    }));
    const r = parseReportInput({
      meta: {
        matter: "Hernandez v. Pacific Rail Corp., No. 25-cv-5678 (C.D. Cal.)",
        retainingCounsel: "Sullivan & Cromwell LLP",
        expertRole: "Forensic Vocational Rehabilitation Expert",
      },
      profile: {
        fullName: "Dr. Maria T. Chen, Ph.D., CRC, ABVE/D",
        credentials: "Certified Rehabilitation Counselor; American Board of Vocational Experts Diplomate",
        publicationsLast10yr: Array.from({ length: 5 }, (_, i) =>
          `Chen MT (${2020 + i}). Vocational outcomes following spinal cord injury. Rehab J ${10 + i}:${i + 1}-${i + 20}.`,
        ),
        priorTestimonyLast4yr: Array.from({ length: 10 }, (_, i) =>
          `${["Smith", "Jones", "Brown", "Davis", "Wilson"][i % 5]} v. ACME Corp. (${2022 + (i % 3)}) — deposition`,
        ),
        compensationStatement: "Billed at $350/hr for evaluation and $450/hr for court testimony.",
      },
      evidence,
      sections,
      style: {
        font: "times",
        fontSizePt: 12,
        lineSpacing: "double",
        headingNumbering: "decimal",
        includeCoverPage: true,
        footerText: "CONFIDENTIAL — Expert Report Draft",
        reportDate: "June 14, 2026",
        includeDisclosure: true,
        includeMapping: true,
        includeReadiness: true,
        lineNumbers: true,
      },
      noAi: false,
    });
    expect(r.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. profile array sub-field bounds
// ---------------------------------------------------------------------------

describe("profile — array sub-field bounds", () => {
  it("rejects publicationsLast10yr array with more than 50 entries", () => {
    const r = parseReportInput({
      ...minimalValid(),
      profile: {
        fullName: "Dr. Expert",
        publicationsLast10yr: Array.from({ length: 51 }, (_, i) => `Publication ${i}`),
      },
    });
    expect(r.success).toBe(false);
  });

  it("rejects priorTestimonyLast4yr array with more than 100 entries", () => {
    const r = parseReportInput({
      ...minimalValid(),
      profile: {
        fullName: "Dr. Expert",
        priorTestimonyLast4yr: Array.from({ length: 101 }, (_, i) => `Case ${i}`),
      },
    });
    expect(r.success).toBe(false);
  });

  it("rejects a publication entry longer than 400 characters", () => {
    const r = parseReportInput({
      ...minimalValid(),
      profile: {
        fullName: "Dr. Expert",
        publicationsLast10yr: ["x".repeat(401)],
      },
    });
    expect(r.success).toBe(false);
  });

  it("rejects compensationStatement longer than 1 000 characters", () => {
    const r = parseReportInput({
      ...minimalValid(),
      profile: {
        fullName: "Dr. Expert",
        compensationStatement: "x".repeat(1_001),
      },
    });
    expect(r.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 11. Route-level invariants (documented, not re-tested — schema is the focus)
// ---------------------------------------------------------------------------
// NOTE: Duplicate evidence IDs and duplicate section keys are caught at the
// route level (route.ts lines 40-46), NOT by the Zod schema. The schema
// itself would accept { evidence: [{id:"e1",...},{id:"e1",...}] }.
// Tests for those checks live in src/test/exportRoute.test.ts.
//
// GAP — the schema does NOT enforce unique evidence IDs or unique section
// keys. That invariant lives only in the route handler, so a consumer of
// parseReportInput (outside the route) would not catch duplicates.
