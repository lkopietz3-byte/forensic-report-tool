import { describe, expect, it } from "vitest";
import { AuditLog } from "../lib/domain/audit.js";
import { generateDisclosureAppendix } from "../lib/domain/disclosure.js";
import type { EvidenceUnit } from "../lib/domain/types.js";

const evidence: EvidenceUnit[] = [
  { id: "e1", inputId: "i1", content: "Weld cracked.", location: "Photo 7" },
  { id: "e2", inputId: "i1", content: "Load 12kN.", location: "Calc sheet p.3" },
];

function seedLog(): AuditLog {
  const log = new AuditLog();
  log.append({
    reportId: "r1",
    sectionKey: "opinions",
    prompt: "SYSTEM\nUSER",
    model: "claude-sonnet-4-6",
    modelVersion: "2026-05-01",
    inputIds: ["e1", "e2"],
    output: "The weld failed [[E:e1]] under load [[E:e2]].",
  });
  log.append({
    reportId: "r2",
    sectionKey: "analysis",
    prompt: "other report",
    model: "claude-sonnet-4-6",
    modelVersion: "2026-05-01",
    inputIds: ["e1"],
    output: "Unrelated [[E:e1]].",
  });
  return log;
}

describe("generateDisclosureAppendix", () => {
  it("includes only events for the requested report", () => {
    const a = generateDisclosureAppendix("r1", seedLog(), evidence);
    expect(a.entries).toHaveLength(1);
    expect(a.rawEvents).toHaveLength(1);
    expect(a.entries[0].sectionKey).toBe("opinions");
  });

  it("resolves evidence ids to human-readable source locations", () => {
    const a = generateDisclosureAppendix("r1", seedLog(), evidence);
    const sources = a.entries[0].evidenceSources;
    expect(sources).toEqual([
      { id: "e1", location: "Photo 7" },
      { id: "e2", location: "Calc sheet p.3" },
    ]);
  });

  it("marks unknown evidence ids rather than dropping them", () => {
    const log = new AuditLog();
    log.append({
      reportId: "r1",
      sectionKey: "opinions",
      prompt: "p",
      model: "m",
      modelVersion: "v",
      inputIds: ["missing"],
      output: "o",
    });
    const a = generateDisclosureAppendix("r1", log, evidence);
    expect(a.entries[0].evidenceSources[0]).toEqual({
      id: "missing",
      location: "(source not found)",
    });
  });

  it("lists each distinct model+version once", () => {
    const a = generateDisclosureAppendix("r1", seedLog(), evidence);
    expect(a.models).toEqual(["claude-sonnet-4-6 (2026-05-01)"]);
  });

  it("carries a non-empty disclosure statement and a generation timestamp", () => {
    const a = generateDisclosureAppendix("r1", seedLog(), evidence);
    expect(a.statement.length).toBeGreaterThan(0);
    expect(new Date(a.generatedAt).toString()).not.toBe("Invalid Date");
  });

  it("reports the backing audit chain as verified for an intact log", () => {
    const a = generateDisclosureAppendix("r1", seedLog(), evidence);
    expect(a.integrity.verified).toBe(true);
    expect(a.integrity.note.length).toBeGreaterThan(0);
  });
});
