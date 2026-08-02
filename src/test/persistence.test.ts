import { describe, it, expect } from "vitest";
import { assembleUserReport, type AssembleInput } from "@/lib/report/assemble";
import {
  toEvidenceRows,
  toSectionRows,
  toAuditRows,
  toProfileRow,
  auditRowsToEvents,
  profileRowToProfile,
  rowsToAssembleInput,
} from "@/lib/report/persistence";
import { verifyAuditChain } from "@/lib/domain/audit";

const INPUT: AssembleInput = {
  meta: {
    matter: "Alvarez v. Brightline, No. 2025-CV-04417",
    retainingCounsel: "Hahn & Castro LLP",
    expertRole: "Vocational rehabilitation expert",
  },
  profile: {
    fullName: "Dana M. Whitfield, M.S., CRC",
    credentials: "CRC; ABVE/D",
    publicationsLast10yr: [],
    priorTestimonyLast4yr: ["Reyes v. Coastal Freight (2024) — deposition"],
    compensationStatement: "$295/hr review; not contingent on outcome.",
  },
  evidence: [
    { id: "E1", content: "Claimant is a 47-year-old former HVAC installer.", location: "Records, Dr. Okonkwo" },
    { id: "E2", content: "FCE limits lifting to 25 pounds occasionally.", location: "FCE report, p.6" },
    { id: "E3", content: "Pre-injury earnings averaged $72,400.", location: "W-2 summary, Ex. 11" },
  ],
  sections: [
    { key: "background", evidenceIds: ["E1"] },
    { key: "functional_capacity", evidenceIds: ["E2"] },
    { key: "earning_capacity", evidenceIds: ["E3"] },
    { key: "qualifications", evidenceIds: [] },
    { key: "compensation", evidenceIds: [] },
  ],
};

describe("report persistence mappers", () => {
  it("tags each evidence row with the section the expert assigned it to", () => {
    const rows = toEvidenceRows(INPUT);
    expect(rows.find((r) => r.ref_id === "E1")?.section_key).toBe("background");
    expect(rows.find((r) => r.ref_id === "E2")?.section_key).toBe("functional_capacity");
    expect(rows.find((r) => r.ref_id === "E3")?.section_key).toBe("earning_capacity");
  });

  it("round-trips the audit chain through DB rows and still verifies (the moat survives persistence)", async () => {
    const report = await assembleUserReport(INPUT, null);
    const rows = toAuditRows(report);
    expect(rows.length).toBeGreaterThan(0);

    const events = auditRowsToEvents(rows);
    const check = verifyAuditChain(events);
    expect(check.ok).toBe(true);
    // The in-memory chain and the rehydrated chain agree.
    expect(events.map((e) => e.entryHash)).toEqual(
      report.appendix.rawEvents.map((e) => e.entryHash),
    );
  });

  it("detects tampering with a persisted event (edit output, hash no longer matches)", async () => {
    const report = await assembleUserReport(INPUT, null);
    const rows = toAuditRows(report);
    // Simulate a DBA editing the stored output without updating the hash.
    rows[0] = { ...rows[0]!, output: rows[0]!.output + " (secretly altered)" };

    const events = auditRowsToEvents(rows);
    const check = verifyAuditChain(events);
    expect(check.ok).toBe(false);
    expect(check.brokenAt).toBe(0);
  });

  it("reconstructs the chain order from seq even if rows come back shuffled", async () => {
    const report = await assembleUserReport(INPUT, null);
    const rows = toAuditRows(report);
    const shuffled = [...rows].reverse();
    const events = auditRowsToEvents(shuffled);
    // Despite the reversed input, seq-sorting restores the genuine chain order,
    // so verification passes and the first event links to genesis.
    expect(verifyAuditChain(events).ok).toBe(true);
    expect(events[0]!.prevHash).toBe("0".repeat(64));
  });

  it("rehydrates the builder input faithfully (evidence + section assignment + profile)", async () => {
    const report = await assembleUserReport(INPUT, null);
    const evidenceRows = toEvidenceRows(INPUT);
    const sectionRows = toSectionRows(report);
    const profile = profileRowToProfile(toProfileRow(INPUT.profile));

    const rebuilt = rowsToAssembleInput({
      meta: INPUT.meta,
      profile,
      evidenceRows,
      sectionRows,
    });

    expect(rebuilt.evidence).toEqual(INPUT.evidence);
    expect(profile).toEqual(INPUT.profile);
    // Every originally-chosen section reappears with the same evidence ids.
    for (const original of INPUT.sections) {
      const got = rebuilt.sections.find((s) => s.key === original.key);
      expect(got, `section ${original.key} should rehydrate`).toBeTruthy();
      expect(got!.evidenceIds.sort()).toEqual(original.evidenceIds.sort());
    }
  });

  it("preserves evidence cited in TWO sections across save/reload (no false closed-world breach)", async () => {
    // E2 is legitimately relied on in both functional_capacity AND earning_capacity,
    // and each section's finalText cites it — so if the reload drops E2 from either
    // section, that section's [[E:E2]] becomes an INVALID citation and the gate trips.
    const shared: AssembleInput = {
      ...INPUT,
      sections: [
        { key: "functional_capacity", evidenceIds: ["E2"], finalText: "Lifting is limited to 25 pounds occasionally [[E:E2]]." },
        { key: "earning_capacity", evidenceIds: ["E2", "E3"], finalText: "The lifting limit constrains earning capacity [[E:E2]]. Pre-injury earnings averaged $72,400 [[E:E3]]." },
        { key: "compensation", evidenceIds: [] },
      ],
    };
    const report = await assembleUserReport(shared, null);
    const rebuilt = rowsToAssembleInput({
      meta: shared.meta,
      profile: profileRowToProfile(toProfileRow(shared.profile)),
      evidenceRows: toEvidenceRows(shared),
      sectionRows: toSectionRows(report),
    });

    // Both sections must regain E2. The evidence row stores a single (last-wins)
    // section_key, so without unioning the section's cited ids, functional_capacity
    // would lose E2 and its [[E:E2]] cite would reload as an INVALID citation.
    expect(rebuilt.sections.find((s) => s.key === "functional_capacity")!.evidenceIds).toContain("E2");
    expect(rebuilt.sections.find((s) => s.key === "earning_capacity")!.evidenceIds).toContain("E2");
    // And a full rebuild from the reloaded input still grounds clean — no breach.
    const reassembled = await assembleUserReport(rebuilt, null);
    expect(reassembled.sections.filter((s) => !s.isProfile && !s.grounding.isClean)).toEqual([]);
  });

  it("profile row maps arrays both ways without loss", () => {
    const row = toProfileRow(INPUT.profile);
    expect(row.full_name).toBe(INPUT.profile.fullName);
    expect(row.prior_testimony_last_4yr).toEqual(INPUT.profile.priorTestimonyLast4yr);
    expect(profileRowToProfile(row)).toEqual(INPUT.profile);
  });
});
