import { describe, expect, it } from "vitest";
import { AuditLog } from "../lib/domain/audit.js";
import {
  reconstructAllOpinions,
  reconstructOpinion,
} from "../lib/domain/reconstruction.js";
import type { AuditLog as AuditLogType } from "../lib/domain/audit.js";
import type { EvidenceUnit, ReportSection } from "../lib/domain/types.js";

const evidence: EvidenceUnit[] = [
  { id: "e1", inputId: "i1", content: "Beam deflected 40mm.", location: "Calc sheet p.3" },
  { id: "e2", inputId: "i1", content: "Load was 12kN.", location: "Calc sheet p.4" },
  { id: "e3", inputId: "i2", content: "Photo of fracture.", location: "Scene photo 7" },
];

function section(over: Partial<ReportSection> & Pick<ReportSection, "key">): ReportSection {
  return {
    title: over.key,
    draftText: "",
    citedEvidenceIds: [],
    ungroundedFlags: [],
    ...over,
  };
}

describe("reconstructOpinion", () => {
  it("maps an opinion to the evidence its adopted text relies on", () => {
    const audit = new AuditLog();
    audit.append({
      reportId: "r1",
      sectionKey: "analysis",
      prompt: "Draft the analysis.",
      model: "claude-sonnet-4-6",
      modelVersion: "claude-sonnet-4-6-20260101",
      inputIds: ["e1", "e2"],
      output: "draft",
    });
    const sections = [
      section({
        key: "analysis",
        finalText: "The beam deflected beyond tolerance [[E:e1]].",
      }),
    ];

    const r = reconstructOpinion("r1", "analysis", sections, audit, evidence);

    expect(r.aiAssisted).toBe(true);
    expect(r.adoptedTextSource).toBe("final");
    expect(r.modelCalls).toHaveLength(1);
    expect(r.modelCalls[0]!.modelVersion).toBe("claude-sonnet-4-6-20260101");
    // e1 is cited in the signed text => relied on; e2 was fed but not cited.
    expect(r.reliedOn).toEqual([{ id: "e1", location: "Calc sheet p.3" }]);
    expect(r.fedButNotReliedOn).toEqual([{ id: "e2", location: "Calc sheet p.4" }]);
    expect(r.reliedOnButNeverFed).toEqual([]);
    expect(r.grounding.isClean).toBe(true);
    expect(r.integrity.verified).toBe(true);
  });

  it("flags a signed opinion that cites evidence never fed (closed-world breach)", () => {
    const audit = new AuditLog();
    audit.append({
      reportId: "r1",
      sectionKey: "analysis",
      prompt: "Draft the analysis.",
      model: "claude-sonnet-4-6",
      modelVersion: "v1",
      inputIds: ["e1"],
      output: "draft",
    });
    const sections = [
      section({
        key: "analysis",
        // e9 was NEVER fed to the model — the fabrication failure mode.
        finalText: "The beam failed [[E:e1]]. A prior inspection confirmed it [[E:e9]].",
      }),
    ];

    const r = reconstructOpinion("r1", "analysis", sections, audit, evidence);

    expect(r.reliedOn).toEqual([{ id: "e1", location: "Calc sheet p.3" }]);
    expect(r.reliedOnButNeverFed).toEqual(["e9"]);
    expect(r.grounding.isClean).toBe(false);
    expect(r.grounding.invalidCitationSentences).toHaveLength(1);
  });

  it("reports tamper-evidence failure when the report chain is broken", () => {
    const audit = new AuditLog();
    const e0 = audit.append({
      reportId: "r1",
      sectionKey: "background",
      prompt: "bg",
      model: "m",
      modelVersion: "v1",
      inputIds: [],
      output: "out0",
    });
    const e1 = audit.append({
      reportId: "r1",
      sectionKey: "analysis",
      prompt: "an",
      model: "m",
      modelVersion: "v1",
      inputIds: ["e1"],
      output: "out1",
    });
    // Tamper: mutate event content while keeping its recorded entryHash.
    const tampered = { ...e1, output: "ALTERED" };
    const stubLog = {
      forReport: () => [e0, tampered],
    } as unknown as AuditLogType;

    const sections = [section({ key: "analysis", finalText: "Text [[E:e1]]." })];
    const r = reconstructOpinion("r1", "analysis", sections, stubLog, evidence);

    expect(r.integrity.verified).toBe(false);
    expect(r.integrity.note).toContain("verification failed");
  });

  it("treats a profile-rendered section as non-AI, not as ungrounded", () => {
    const audit = new AuditLog();
    // No events for this report/section at all.
    const sections = [
      section({
        key: "qualifications",
        finalText: "Jane Doe, P.E. Twenty years of structural forensics.",
      }),
    ];

    const r = reconstructOpinion("r1", "qualifications", sections, audit, evidence);

    expect(r.aiAssisted).toBe(false);
    expect(r.modelCalls).toEqual([]);
    expect(r.grounding.isClean).toBe(true);
    expect(r.grounding.ungroundedSentences).toEqual([]);
  });

  it("falls back to draft text when there is no final text", () => {
    const audit = new AuditLog();
    audit.append({
      reportId: "r1",
      sectionKey: "analysis",
      prompt: "p",
      model: "m",
      modelVersion: "v1",
      inputIds: ["e1"],
      output: "draft",
    });
    const sections = [section({ key: "analysis", draftText: "Draft [[E:e1]]." })];

    const r = reconstructOpinion("r1", "analysis", sections, audit, evidence);
    expect(r.adoptedTextSource).toBe("draft");
    expect(r.reliedOn).toEqual([{ id: "e1", location: "Calc sheet p.3" }]);
  });

  it("throws when the challenged section is absent", () => {
    const audit = new AuditLog();
    expect(() =>
      reconstructOpinion("r1", "analysis", [], audit, evidence),
    ).toThrow(/not found/);
  });
});

describe("reconstructAllOpinions", () => {
  it("reconstructs one entry per supplied section, in order", () => {
    const audit = new AuditLog();
    audit.append({
      reportId: "r1",
      sectionKey: "analysis",
      prompt: "p",
      model: "m",
      modelVersion: "v1",
      inputIds: ["e1"],
      output: "draft",
    });
    const sections = [
      section({ key: "background", finalText: "Background." }),
      section({ key: "analysis", finalText: "Analysis [[E:e1]]." }),
    ];

    const all = reconstructAllOpinions("r1", sections, audit, evidence);
    expect(all.map((r) => r.sectionKey)).toEqual(["background", "analysis"]);
    expect(all[1]!.reliedOn).toEqual([{ id: "e1", location: "Calc sheet p.3" }]);
  });
});
