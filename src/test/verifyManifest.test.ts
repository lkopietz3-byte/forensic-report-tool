import { describe, it, expect } from "vitest";
import { AuditLog, verifyAuditChain } from "@/lib/domain/audit";
import {
  verifyManifestChain,
  canonicalJSON,
  buildManifest,
  parseManifest,
  GENESIS_HASH,
} from "@/lib/domain/verifyManifest";
import type { AuditEvent } from "@/lib/domain/types";

// Build a real chain with the SERVER hasher (audit.ts → node:crypto), then prove
// the portable verifier (verifyManifest.ts → Web Crypto) agrees byte-for-byte.
// If these two ever drift, an independently-verified report would read as
// "tampered" — so this parity is load-bearing for the whole moat.
function sampleChain(): AuditLog {
  const log = new AuditLog();
  log.append({
    reportId: "r1",
    sectionKey: "scope_of_assignment",
    prompt: "Draft the scope from the engagement letter.",
    model: "claude-opus-4-8",
    modelVersion: "20260101",
    inputIds: ["e1", "e2"],
    output: "The expert was retained to assess earning capacity [[E:e1]].",
  });
  log.append({
    reportId: "r1",
    sectionKey: "opinions",
    prompt: "Draft the opinions from the vocational evaluation.",
    model: "claude-opus-4-8",
    modelVersion: "20260101",
    inputIds: ["e3"],
    output: "Post-injury, the plaintiff retains sedentary capacity [[E:e3]].",
  });
  // A second report's events must not bleed into r1's chain.
  log.append({
    reportId: "r2",
    sectionKey: "opinions",
    prompt: "unrelated",
    model: "claude-opus-4-8",
    modelVersion: "20260101",
    inputIds: [],
    output: "unrelated",
  });
  return log;
}

function clone(events: AuditEvent[]): AuditEvent[] {
  return JSON.parse(JSON.stringify(events));
}

describe("verifyManifest — portable parity with the server hash chain", () => {
  it("agrees with node verifyAuditChain on an intact chain", async () => {
    const events = sampleChain().forReport("r1");
    expect(verifyAuditChain(events).ok).toBe(true); // server (node:crypto)
    const portable = await verifyManifestChain(events); // browser (Web Crypto)
    expect(portable.ok).toBe(true);
    expect(portable.brokenAt).toBe(-1);
    expect(portable.count).toBe(2);
  });

  it("survives a JSON round-trip (download → re-parse → verify)", async () => {
    const events = sampleChain().forReport("r1");
    const manifest = buildManifest({ matter: "Alvarez v. Brightline" }, events, "2026-06-18T00:00:00.000Z");
    const reparsed = parseManifest(JSON.parse(JSON.stringify(manifest)));
    expect(reparsed).not.toBeNull();
    const portable = await verifyManifestChain(reparsed!.events);
    expect(portable.ok).toBe(true);
  });

  it("detects a mutated field at the right index", async () => {
    const events = clone(sampleChain().forReport("r1"));
    events[1]!.output = "Post-injury, the plaintiff can never work again."; // doctored opinion
    const portable = await verifyManifestChain(events);
    expect(portable.ok).toBe(false);
    expect(portable.brokenAt).toBe(1);
  });

  it("detects a severed prevHash link", async () => {
    const events = clone(sampleChain().forReport("r1"));
    events[1]!.prevHash = GENESIS_HASH; // pretend event 1 followed genesis
    const portable = await verifyManifestChain(events);
    expect(portable.ok).toBe(false);
    expect(portable.brokenAt).toBe(1);
  });

  it("detects a removed (spliced-out) event", async () => {
    const log = new AuditLog();
    for (const out of ["O1", "O2", "O3"]) {
      log.append({
        reportId: "r1",
        sectionKey: "opinions",
        prompt: "p",
        model: "m",
        modelVersion: "v",
        inputIds: [],
        output: out,
      });
    }
    const events = clone(log.forReport("r1"));
    events.splice(1, 1); // delete the middle event
    const portable = await verifyManifestChain(events);
    expect(portable.ok).toBe(false);
    expect(portable.brokenAt).toBe(1);
  });

  it("detects an appended forged event (no valid predecessor hash)", async () => {
    const events = clone(sampleChain().forReport("r1"));
    events.push({
      ...events[1]!,
      output: "Fabricated extra opinion.",
      prevHash: "f".repeat(64), // does not chain from event 1
    });
    const portable = await verifyManifestChain(events);
    expect(portable.ok).toBe(false);
    expect(portable.brokenAt).toBe(2);
  });

  it("canonicalJSON is key-order independent", () => {
    const a = canonicalJSON({ b: 1, a: 2, nested: { y: 1, x: 2 } });
    const b = canonicalJSON({ a: 2, nested: { x: 2, y: 1 }, b: 1 });
    expect(a).toBe(b);
  });

  it("treats an empty chain as vacuously intact", async () => {
    const portable = await verifyManifestChain([]);
    expect(portable.ok).toBe(true);
    expect(portable.count).toBe(0);
  });

  it("rejects structurally malformed manifests", () => {
    expect(parseManifest(null)).toBeNull();
    expect(parseManifest({})).toBeNull();
    expect(parseManifest({ events: "nope" })).toBeNull();
    expect(parseManifest({ events: [1, 2] })).toBeNull();
    expect(parseManifest({ events: [] })).not.toBeNull();
  });
});
