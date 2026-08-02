import { describe, expect, it } from "vitest";
import { AuditLog, verifyAuditChain } from "@/lib/domain/audit";
import { generateDisclosureAppendix } from "@/lib/domain/disclosure";
import type { EvidenceUnit } from "@/lib/domain/types";

// The AI-Disclosure Appendix is the moat. It must be a PURE PROJECTION of the
// append-only audit log: it can disclose only what the log recorded, and any
// after-the-fact tampering must flip its integrity flag. These guard that
// contract directly.

const EVIDENCE: EvidenceUnit[] = [
  { id: "e1", inputId: "i", content: "Engagement letter", location: "Engagement letter ¶2" },
  { id: "e2", inputId: "i", content: "Wage records", location: "W-2 2019–2022" },
];

function seededLog(): AuditLog {
  const audit = new AuditLog();
  audit.append({
    reportId: "r1",
    sectionKey: "scope_of_assignment",
    prompt: "Draft scope from evidence.",
    model: "claude-sonnet-4-6",
    modelVersion: "2026-05-01",
    inputIds: ["e1"],
    output: "Scope text [[E:e1]].",
  });
  audit.append({
    reportId: "r1",
    sectionKey: "earning_capacity",
    prompt: "Draft earning capacity.",
    model: "claude-sonnet-4-6",
    modelVersion: "2026-05-01",
    inputIds: ["e1", "e2"],
    output: "Capacity text [[E:e2]].",
  });
  return audit;
}

describe("disclosure appendix — pure projection", () => {
  it("discloses exactly one entry per recorded event, in order", () => {
    const a = generateDisclosureAppendix("r1", seededLog(), EVIDENCE);
    expect(a.entries.map((e) => e.sectionKey)).toEqual([
      "scope_of_assignment",
      "earning_capacity",
    ]);
    expect(a.entries[1].evidenceSources.map((s) => s.id)).toEqual(["e1", "e2"]);
  });

  it("resolves every disclosed source to its supplied location", () => {
    const a = generateDisclosureAppendix("r1", seededLog(), EVIDENCE);
    expect(a.entries[0].evidenceSources[0].location).toBe("Engagement letter ¶2");
  });

  it("flags a missing source rather than inventing one", () => {
    const audit = new AuditLog();
    audit.append({
      reportId: "r1",
      sectionKey: "opinions",
      prompt: "x",
      model: "m",
      modelVersion: "v",
      inputIds: ["e_missing"],
      output: "y [[E:e_missing]].",
    });
    const a = generateDisclosureAppendix("r1", audit, EVIDENCE);
    expect(a.entries[0].evidenceSources[0].location).toBe("(source not found)");
  });

  it("discloses only the requested report's events", () => {
    const audit = seededLog();
    audit.append({
      reportId: "OTHER",
      sectionKey: "opinions",
      prompt: "x",
      model: "m",
      modelVersion: "v",
      inputIds: ["e1"],
      output: "z [[E:e1]].",
    });
    const a = generateDisclosureAppendix("r1", audit, EVIDENCE);
    expect(a.entries).toHaveLength(2); // the OTHER report's event is not disclosed
  });

  it("verifies integrity for an untampered chain", () => {
    const a = generateDisclosureAppendix("r1", seededLog(), EVIDENCE);
    expect(a.integrity.verified).toBe(true);
    expect(a.integrity.note).not.toMatch(/may have been altered|verification failed/i);
    expect(a.integrity.note).toMatch(/unaltered|consistent/i);
  });

  it("fails integrity when a recorded event is altered after the fact", () => {
    const a = generateDisclosureAppendix("r1", seededLog(), EVIDENCE);
    // Recorded events are frozen, so simulate tampering on a copy: change the
    // output of the first event. Its entryHash no longer matches.
    const tampered = a.rawEvents.map((e, i) =>
      i === 0 ? { ...e, output: "SECRETLY CHANGED" } : e,
    );
    const v = verifyAuditChain(tampered);
    expect(v.ok).toBe(false);
    expect(v.brokenAt).toBe(0);
  });

  it("fails integrity when an event is dropped from the middle", () => {
    const a = generateDisclosureAppendix("r1", seededLog(), EVIDENCE);
    const withHole = [a.rawEvents[0]]; // drop the second; chain becomes incomplete only if >2
    // Build a 3-event chain to drop the middle.
    const audit = seededLog();
    audit.append({
      reportId: "r1",
      sectionKey: "opinions",
      prompt: "x",
      model: "m",
      modelVersion: "v",
      inputIds: ["e1"],
      output: "third [[E:e1]].",
    });
    const events = audit.forReport("r1");
    const dropped = [events[0], events[2]]; // remove the middle event
    const v = verifyAuditChain(dropped);
    expect(v.ok).toBe(false);
    expect(withHole).toHaveLength(1); // sanity: arrays built as intended
  });
});
