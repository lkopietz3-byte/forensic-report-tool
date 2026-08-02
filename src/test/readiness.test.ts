import { describe, expect, it } from "vitest";
import { assessReadiness } from "../lib/domain/readiness.js";
import type { Rule26Result } from "../lib/domain/rule26.js";
import type { OpinionReconstruction } from "../lib/domain/reconstruction.js";
import { buildSampleReport } from "../lib/domain/sample.js";

const cleanRule26: Rule26Result = { ok: true, issues: [] };

function recon(
  over: Partial<OpinionReconstruction> = {},
): OpinionReconstruction {
  return {
    reportId: "r1",
    sectionKey: "opinions",
    aiAssisted: true,
    adoptedTextSource: "draft",
    modelCalls: [],
    reliedOn: [],
    fedButNotReliedOn: [],
    reliedOnButNeverFed: [],
    grounding: {
      isClean: true,
      ungroundedSentences: [],
      invalidCitationSentences: [],
      placeholderSentences: [],
    },
    integrity: { verified: true, note: "ok" },
    ...over,
  };
}

describe("assessReadiness", () => {
  it("reports ready with no findings when everything is clean", () => {
    const v = assessReadiness(cleanRule26, [recon()]);
    expect(v.ready).toBe(true);
    expect(v.blockers).toBe(0);
    expect(v.warnings).toBe(0);
    expect(v.findings).toEqual([]);
    expect(v.headline).toMatch(/clean/i);
  });

  it("turns each Rule 26 issue into a blocker", () => {
    const rule26: Rule26Result = {
      ok: false,
      issues: [
        { key: "opinions", label: "(i) opinions", reason: "missing" },
        { key: "compensation", label: "(vi) compensation", reason: "empty" },
      ],
    };
    const v = assessReadiness(rule26, [recon()]);
    expect(v.ready).toBe(false);
    expect(v.blockers).toBe(2);
    expect(v.findings.every((f) => f.code === "rule26_incomplete")).toBe(true);
  });

  it("flags a closed-world breach as a blocker (the existential failure mode)", () => {
    const v = assessReadiness(cleanRule26, [
      recon({ sectionKey: "analysis", reliedOnButNeverFed: ["ev_ghost"] }),
    ]);
    expect(v.ready).toBe(false);
    const f = v.findings.find((x) => x.code === "closed_world_breach");
    expect(f?.severity).toBe("blocker");
    expect(f?.message).toContain("ev_ghost");
  });

  it("flags invalid citations as a blocker", () => {
    const v = assessReadiness(cleanRule26, [
      recon({
        grounding: {
          isClean: false,
          ungroundedSentences: [],
          invalidCitationSentences: ["A sentence citing [[E:nope]]."],
          placeholderSentences: [],
        },
      }),
    ]);
    expect(v.ready).toBe(false);
    expect(v.findings.some((f) => f.code === "invalid_citation")).toBe(true);
  });

  it("reports a failed audit chain once, report-wide, as the first blocker", () => {
    const v = assessReadiness(cleanRule26, [
      recon({ integrity: { verified: false, note: "broken" } }),
      recon({ sectionKey: "analysis", integrity: { verified: false, note: "broken" } }),
    ]);
    const chainFindings = v.findings.filter(
      (f) => f.code === "audit_chain_unverified",
    );
    expect(chainFindings).toHaveLength(1);
    expect(v.findings[0]!.code).toBe("audit_chain_unverified");
  });

  it("treats placeholders and ungrounded sentences as warnings, not blockers", () => {
    const v = assessReadiness(cleanRule26, [
      recon({
        grounding: {
          isClean: false,
          ungroundedSentences: ["loose sentence"],
          invalidCitationSentences: [],
          placeholderSentences: ["[Expert input needed: x]"],
        },
      }),
    ]);
    expect(v.ready).toBe(true);
    expect(v.blockers).toBe(0);
    expect(v.warnings).toBe(2);
    expect(v.findings.map((f) => f.code).sort()).toEqual([
      "open_expert_item",
      "ungrounded_sentence",
    ]);
  });

  it("the worked sample is structurally complete with open expert items, no blockers", () => {
    const report = buildSampleReport();
    const v = assessReadiness(report.rule26, report.reconstructions);
    expect(v.ready).toBe(true);
    expect(v.blockers).toBe(0);
    // The sample's loss-of-earning-capacity and opinions sections each carry an
    // [Expert input needed: …] placeholder by design.
    expect(v.warnings).toBeGreaterThan(0);
    expect(v.findings.some((f) => f.code === "open_expert_item")).toBe(true);
    expect(v.headline).toMatch(/open item/i);
  });
});
