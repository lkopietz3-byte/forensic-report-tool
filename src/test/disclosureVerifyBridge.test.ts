import { describe, it, expect } from "vitest";
import { AuditLog } from "@/lib/domain/audit";
import { generateDisclosureAppendix } from "@/lib/domain/disclosure";
import { buildManifest, verifyManifestChain } from "@/lib/domain/verifyManifest";
import type { EvidenceUnit } from "@/lib/domain/types";

// The moat has two halves: the AI-Disclosure Appendix the server builds, and the
// independent /verify tool a third party runs. This pins the BRIDGE between them
// — a manifest built from an appendix's rawEvents must verify, and doctoring a
// disclosed event must be caught. If they ever drift, a real report would read as
// "tampered" (or a doctored one as clean), which is existential for the product.
function unit(id: string): EvidenceUnit {
  return { id, content: "c", location: "L" } as unknown as EvidenceUnit;
}

function appendixFixture() {
  const log = new AuditLog();
  log.append({
    reportId: "r1",
    sectionKey: "scope_of_assignment",
    prompt: "Structure the scope.",
    model: "claude-opus-4-8",
    modelVersion: "20260101",
    inputIds: ["e1"],
    output: "The expert was retained to assess earning capacity [[E:e1]].",
  });
  log.append({
    reportId: "r1",
    sectionKey: "opinions",
    prompt: "Structure the opinions.",
    model: "claude-opus-4-8",
    modelVersion: "20260101",
    inputIds: ["e2"],
    output: "The plaintiff retains sedentary capacity [[E:e2]].",
  });
  return generateDisclosureAppendix("r1", log, [unit("e1"), unit("e2")]);
}

describe("disclosure appendix ↔ independent verifier bridge", () => {
  it("a manifest built from the appendix's rawEvents verifies as intact", async () => {
    const appendix = appendixFixture();
    expect(appendix.integrity.verified).toBe(true); // server-side check agrees
    const manifest = buildManifest(
      { matter: "Alvarez v. Brightline" },
      appendix.rawEvents,
      appendix.generatedAt,
    );
    const result = await verifyManifestChain(manifest.events);
    expect(result.ok).toBe(true);
    expect(result.count).toBe(appendix.rawEvents.length);
  });

  it("doctoring a disclosed event is caught by the independent verifier", async () => {
    const appendix = appendixFixture();
    const events = JSON.parse(JSON.stringify(appendix.rawEvents));
    events[1].output = "The plaintiff is permanently and totally unemployable [[E:e2]].";
    const result = await verifyManifestChain(events);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it("the appendix discloses only events for its own report (a closed, per-report chain)", () => {
    const log = new AuditLog();
    log.append({
      reportId: "r1",
      sectionKey: "opinions",
      prompt: "p",
      model: "m",
      modelVersion: "v",
      inputIds: [],
      output: "mine",
    });
    log.append({
      reportId: "OTHER",
      sectionKey: "opinions",
      prompt: "p",
      model: "m",
      modelVersion: "v",
      inputIds: [],
      output: "not mine",
    });
    const appendix = generateDisclosureAppendix("r1", log, []);
    expect(appendix.rawEvents).toHaveLength(1);
    expect(appendix.rawEvents.every((e) => e.reportId === "r1")).toBe(true);
  });
});
