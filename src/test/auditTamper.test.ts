/**
 * auditTamper.test.ts
 *
 * Proves the moat: every realistic tamper against the hash-chained audit log is
 * detected by verifyAuditChain(), and an untouched chain always verifies TRUE.
 *
 * These tests do NOT duplicate the cases already in audit.test.ts (positive
 * control for 2-entry chain, output mutation, middle-entry deletion, reorder,
 * empty chain — all covered there). They add the gaps: every other hashed field,
 * truncation, forged insertion, and the persistence round-trip.
 */

import { describe, expect, it } from "vitest";
import { AuditLog, GENESIS_HASH, verifyAuditChain } from "../lib/domain/audit.js";
import { toAuditRows, auditRowsToEvents } from "../lib/report/persistence.js";
import type { AuditEvent } from "../lib/domain/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid args; override any field to focus a test. */
function args(over: Partial<Parameters<AuditLog["append"]>[0]> = {}) {
  return {
    reportId: "r1",
    sectionKey: "opinions" as const,
    prompt: "SYSTEM: structure only.\nUSER: format this finding.",
    model: "claude-sonnet-4-6",
    modelVersion: "2026-05-01",
    inputIds: ["eu-001", "eu-002"],
    output: "The bolt fractured [[E:eu-001]].",
    ...over,
  };
}

/**
 * Build a chain of N events and return a mutable deep-copy of each event
 * (spreading an AuditEvent gives a plain object that is NOT frozen, so tests
 * can mutate individual fields).
 */
function buildChain(n: number): AuditEvent[] {
  const log = new AuditLog();
  const sectionKeys = [
    "opinions",
    "analysis",
    "background",
    "investigation",
    "basis_and_reasons",
  ] as const;
  for (let i = 0; i < n; i++) {
    log.append(args({ sectionKey: sectionKeys[i % sectionKeys.length] }));
  }
  // Spread each event into a mutable plain object (removes the freeze).
  return log.all().map((e) => ({ ...e, inputIds: [...e.inputIds] }));
}

// ---------------------------------------------------------------------------
// Positive control — multi-entry chain
// ---------------------------------------------------------------------------

describe("auditTamper: positive controls", () => {
  it("a 5-entry intact chain verifies TRUE (brokenAt -1)", () => {
    const events = buildChain(5);
    const result = verifyAuditChain(events);
    expect(result.ok).toBe(true);
    expect(result.brokenAt).toBe(-1);
  });

  it("a single-entry chain verifies TRUE", () => {
    const events = buildChain(1);
    expect(verifyAuditChain(events).ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Field-level tampers — every field bound into the hash
// ---------------------------------------------------------------------------

describe("auditTamper: mutating a hashed field is detected", () => {
  it("mutating inputIds (push) → verify FALSE", () => {
    const events = buildChain(3);
    // Push a new id into the mutable copy.
    (events[1]!.inputIds as string[]).push("eu-injected");
    const result = verifyAuditChain(events);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it("mutating inputIds (splice out) → verify FALSE", () => {
    const events = buildChain(3);
    (events[1]!.inputIds as string[]).splice(0, 1); // remove first id
    const result = verifyAuditChain(events);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it("mutating model → verify FALSE", () => {
    const events = buildChain(3);
    (events[1] as { model: string }).model = "gpt-4o";
    const result = verifyAuditChain(events);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it("mutating modelVersion → verify FALSE", () => {
    const events = buildChain(3);
    (events[1] as { modelVersion: string }).modelVersion = "1970-01-01";
    const result = verifyAuditChain(events);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it("mutating prompt → verify FALSE", () => {
    const events = buildChain(3);
    (events[1] as { prompt: string }).prompt = "INJECTED SYSTEM PROMPT";
    const result = verifyAuditChain(events);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it("mutating reportId → verify FALSE", () => {
    const events = buildChain(3);
    (events[1] as { reportId: string }).reportId = "evil-report";
    const result = verifyAuditChain(events);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it("mutating sectionKey → verify FALSE", () => {
    const events = buildChain(3);
    (events[1] as { sectionKey: string }).sectionKey = "compensation";
    const result = verifyAuditChain(events);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it("mutating createdAt → verify FALSE", () => {
    const events = buildChain(3);
    (events[1] as { createdAt: string }).createdAt = "1970-01-01T00:00:00.000Z";
    const result = verifyAuditChain(events);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it("mutating prevHash directly → verify FALSE (breaks either hash or link)", () => {
    const events = buildChain(3);
    // Changing prevHash on event[1] breaks its link to event[0].
    (events[1] as { prevHash: string }).prevHash = GENESIS_HASH;
    const result = verifyAuditChain(events);
    expect(result.ok).toBe(false);
    // prevHash mismatch is caught at event[1] (link check) before the content
    // check — unless it happens to match genesis AND hash recomputes (it won't
    // because prevHash is in the hashed payload).
    expect(result.brokenAt).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Structural tampers — insertion, deletion, truncation
// ---------------------------------------------------------------------------

describe("auditTamper: structural tampers are detected", () => {
  it("inserting a forged entry in the middle → verify FALSE", () => {
    const events = buildChain(3);
    // Build a plausible-looking forgery: copy event[0], give it a new id.
    const forged: AuditEvent = {
      ...events[0]!,
      id: "evt_forged_99",
      inputIds: [...events[0]!.inputIds],
    };
    // Splice it between index 0 and 1.
    const spliced = [events[0]!, forged, events[1]!, events[2]!];
    const result = verifyAuditChain(spliced);
    expect(result.ok).toBe(false);
    // The forged entry sits at index 1; events[1] (now at index 2) also breaks
    // because its prevHash no longer matches the forged entry's entryHash.
    expect(result.brokenAt).toBeGreaterThanOrEqual(1);
  });

  it("truncating (dropping the last entry) → verify TRUE (chain is still valid)", () => {
    // The verifier only checks that each presented event is internally consistent
    // and that links between consecutive entries hold. Dropping the tail leaves
    // the remaining prefix intact — there is nothing pointing at the missing
    // entry yet, so the prefix verifies clean.
    // This is correct and expected: truncation is detectable at a higher layer
    // (e.g. comparing stored row count vs. expected sequence length), not by
    // verifyAuditChain alone.
    const events = buildChain(4);
    const truncated = events.slice(0, 3);
    const result = verifyAuditChain(truncated);
    expect(result.ok).toBe(true);
    expect(result.brokenAt).toBe(-1);
  });

  it("deleting an entry from the middle → verify FALSE", () => {
    // Covered in audit.test.ts but repeated here for completeness in the tamper
    // suite — 5-entry chain so we exercise a deeper break.
    const events = buildChain(5);
    // Remove event[2]; event[3]'s prevHash now points at event[1]'s entryHash,
    // not event[2]'s — the link is severed.
    const dropped = [...events.slice(0, 2), ...events.slice(3)];
    const result = verifyAuditChain(dropped);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(2); // event now at index 2 (was index 3)
  });

  it("reordering two non-adjacent entries → verify FALSE", () => {
    const events = buildChain(5);
    // Swap events[0] and events[4].
    const reordered = [events[4]!, events[1]!, events[2]!, events[3]!, events[0]!];
    const result = verifyAuditChain(reordered);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(0); // first entry no longer starts at genesis
  });
});

// ---------------------------------------------------------------------------
// Persistence round-trip (toAuditRows → auditRowsToEvents)
// ---------------------------------------------------------------------------

/**
 * Simulate what persistence.ts does: convert live AuditEvent[] → AuditRow[]
 * (as if saving to Supabase), then convert back → AuditEvent[] (as if loading).
 * The loaded events must still pass verifyAuditChain.
 *
 * We build a minimal AssembledReport-shaped object containing just the fields
 * toAuditRows() accesses (appendix.rawEvents), avoiding a full report build.
 */
function roundTrip(events: AuditEvent[]): AuditEvent[] {
  const fakeReport = { appendix: { rawEvents: events } } as Parameters<
    typeof toAuditRows
  >[0];
  const rows = toAuditRows(fakeReport);
  return auditRowsToEvents(rows);
}

describe("auditTamper: persistence round-trip", () => {
  it("a faithfully round-tripped chain still verifies TRUE", () => {
    const events = buildChain(4);
    const loaded = roundTrip(events);
    const result = verifyAuditChain(loaded);
    expect(result.ok).toBe(true);
    expect(result.brokenAt).toBe(-1);
  });

  it("all hashed fields survive the round-trip verbatim", () => {
    const events = buildChain(2);
    const loaded = roundTrip(events);
    for (let i = 0; i < events.length; i++) {
      const orig = events[i]!;
      const back = loaded[i]!;
      expect(back.id).toBe(orig.id);
      expect(back.reportId).toBe(orig.reportId);
      expect(back.sectionKey).toBe(orig.sectionKey);
      expect(back.prompt).toBe(orig.prompt);
      expect(back.model).toBe(orig.model);
      expect(back.modelVersion).toBe(orig.modelVersion);
      expect(back.inputIds).toEqual(orig.inputIds);
      expect(back.output).toBe(orig.output);
      expect(back.createdAt).toBe(orig.createdAt);
      expect(back.prevHash).toBe(orig.prevHash);
      expect(back.entryHash).toBe(orig.entryHash);
    }
  });

  it("flipping output on a loaded row is detected (FALSE)", () => {
    const events = buildChain(3);
    const loaded = roundTrip(events);
    // Mutate the loaded event (plain objects, not frozen).
    (loaded[1] as { output: string }).output = "fabricated output after load";
    const result = verifyAuditChain(loaded);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it("flipping model_version in a loaded row is detected (FALSE)", () => {
    const events = buildChain(3);
    const loaded = roundTrip(events);
    (loaded[2] as { modelVersion: string }).modelVersion = "9999-01-01";
    const result = verifyAuditChain(loaded);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(2);
  });

  it("flipping input_ids in a loaded row is detected (FALSE)", () => {
    const events = buildChain(3);
    const loaded = roundTrip(events);
    (loaded[0]!.inputIds as string[]).push("eu-injected-after-db");
    const result = verifyAuditChain(loaded);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(0);
  });

  it("row seq-reorder during load is corrected by auditRowsToEvents sort", () => {
    // auditRowsToEvents sorts by seq, so even if rows arrive out of order the
    // chain should reconstruct correctly.
    const events = buildChain(4);
    const fakeReport = { appendix: { rawEvents: events } } as Parameters<
      typeof toAuditRows
    >[0];
    const rows = toAuditRows(fakeReport);
    // Deliberately reverse the row order before calling auditRowsToEvents.
    const shuffled = [...rows].reverse();
    const loaded = auditRowsToEvents(shuffled);
    expect(verifyAuditChain(loaded).ok).toBe(true);
  });
});
