import { describe, expect, it } from "vitest";
import {
  AuditLog,
  GENESIS_HASH,
  verifyAuditChain,
} from "../lib/domain/audit.js";
import type { AuditEvent } from "../lib/domain/types.js";

function sampleArgs(over: Partial<Parameters<AuditLog["append"]>[0]> = {}) {
  return {
    reportId: "r1",
    sectionKey: "opinions" as const,
    prompt: "SYSTEM...\nUSER...",
    model: "claude-sonnet-4-6",
    modelVersion: "2026-05-01",
    inputIds: ["e1", "e2"],
    output: "The weld failed [[E:e1]].",
    ...over,
  };
}

describe("AuditLog", () => {
  it("assigns an id and ISO timestamp on append", () => {
    const log = new AuditLog();
    const e = log.append(sampleArgs());
    expect(e.id).toMatch(/^evt_/);
    expect(() => new Date(e.createdAt).toISOString()).not.toThrow();
    expect(new Date(e.createdAt).toString()).not.toBe("Invalid Date");
  });

  it("freezes recorded events so they cannot be mutated", () => {
    const log = new AuditLog();
    const e = log.append(sampleArgs());
    expect(Object.isFrozen(e)).toBe(true);
    expect(Object.isFrozen(e.inputIds)).toBe(true);
    expect(() => {
      (e as { output: string }).output = "tampered";
    }).toThrow();
    expect(e.output).toBe("The weld failed [[E:e1]].");
  });

  it("copies inputIds so later mutation of the source array does not leak in", () => {
    const log = new AuditLog();
    const ids = ["e1"];
    const e = log.append(sampleArgs({ inputIds: ids }));
    ids.push("e2");
    expect(e.inputIds).toEqual(["e1"]);
  });

  it("returns a defensive copy from all() that cannot corrupt the log", () => {
    const log = new AuditLog();
    log.append(sampleArgs());
    const copy = log.all();
    copy.pop();
    expect(log.all()).toHaveLength(1);
  });

  it("filters by report and by section in insertion order", () => {
    const log = new AuditLog();
    log.append(sampleArgs({ reportId: "r1", sectionKey: "opinions" }));
    log.append(sampleArgs({ reportId: "r1", sectionKey: "analysis" }));
    log.append(sampleArgs({ reportId: "r2", sectionKey: "opinions" }));

    expect(log.forReport("r1")).toHaveLength(2);
    expect(log.forReport("r2")).toHaveLength(1);
    expect(log.forSection("r1", "opinions")).toHaveLength(1);
    expect(log.forSection("r1", "analysis")).toHaveLength(1);
  });

  it("has no update or delete surface (append-only)", () => {
    const log = new AuditLog() as unknown as Record<string, unknown>;
    expect(log.update).toBeUndefined();
    expect(log.delete).toBeUndefined();
    expect(log.remove).toBeUndefined();
  });
});

describe("AuditLog hash chain", () => {
  it("links the first event to the genesis hash", () => {
    const log = new AuditLog();
    const e = log.append(sampleArgs());
    expect(e.prevHash).toBe(GENESIS_HASH);
    expect(e.entryHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("each event's prevHash equals the prior event's entryHash", () => {
    const log = new AuditLog();
    const a = log.append(sampleArgs());
    const b = log.append(sampleArgs({ sectionKey: "analysis" }));
    const c = log.append(sampleArgs({ sectionKey: "background" }));
    expect(b.prevHash).toBe(a.entryHash);
    expect(c.prevHash).toBe(b.entryHash);
  });

  it("verifies an intact chain", () => {
    const log = new AuditLog();
    log.append(sampleArgs());
    log.append(sampleArgs({ sectionKey: "analysis" }));
    const result = verifyAuditChain(log.all());
    expect(result.ok).toBe(true);
    expect(result.brokenAt).toBe(-1);
  });

  it("keeps each report on its own genesis-rooted chain", () => {
    const log = new AuditLog();
    log.append(sampleArgs({ reportId: "r1" }));
    log.append(sampleArgs({ reportId: "r2" }));
    log.append(sampleArgs({ reportId: "r1", sectionKey: "analysis" }));
    // Interleaving reports must not break either report's own chain.
    expect(verifyAuditChain(log.forReport("r1")).ok).toBe(true);
    expect(verifyAuditChain(log.forReport("r2")).ok).toBe(true);
    expect(log.forReport("r1")[0]!.prevHash).toBe(GENESIS_HASH);
    expect(log.forReport("r2")[0]!.prevHash).toBe(GENESIS_HASH);
  });

  it("verifies an empty chain", () => {
    expect(verifyAuditChain([]).ok).toBe(true);
  });

  it("detects a mutated field via entryHash mismatch", () => {
    const log = new AuditLog();
    log.append(sampleArgs());
    log.append(sampleArgs({ sectionKey: "analysis" }));
    const events = log.all();
    // Tamper with the output of event 0 without recomputing its hash.
    const tampered: AuditEvent = { ...events[0]!, output: "fabricated" };
    const result = verifyAuditChain([tampered, events[1]!]);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(0);
  });

  it("detects a removed event via a severed link", () => {
    const log = new AuditLog();
    log.append(sampleArgs());
    log.append(sampleArgs({ sectionKey: "analysis" }));
    log.append(sampleArgs({ sectionKey: "background" }));
    const events = log.all();
    // Drop the middle event: event 2's prevHash now points at a missing hash.
    const result = verifyAuditChain([events[0]!, events[2]!]);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it("detects reordered events", () => {
    const log = new AuditLog();
    log.append(sampleArgs());
    log.append(sampleArgs({ sectionKey: "analysis" }));
    const events = log.all();
    const result = verifyAuditChain([events[1]!, events[0]!]);
    expect(result.ok).toBe(false);
  });
});
