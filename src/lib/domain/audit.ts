import { createHash } from "node:crypto";
import type { AuditEvent, ReportSectionKey } from "./types.js";

let counter = 0;
function genId(): string {
  counter += 1;
  return `evt_${Date.now().toString(36)}_${counter.toString(36)}`;
}

/** Genesis link for the first event in a chain. */
export const GENESIS_HASH = "0".repeat(64);

export interface RecordEventArgs {
  reportId: string;
  sectionKey: ReportSectionKey;
  prompt: string;
  model: string;
  modelVersion: string;
  inputIds: string[];
  output: string;
}

/**
 * Deterministic JSON: object keys sorted recursively so the same logical event
 * always serializes to the same bytes, regardless of property insertion order.
 * Hashing depends on this — two semantically identical events must hash equal.
 */
function canonicalJSON(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(",")}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const body = keys
    .map((k) => `${JSON.stringify(k)}:${canonicalJSON((value as Record<string, unknown>)[k])}`)
    .join(",");
  return `{${body}}`;
}

/** The event fields that are bound into the hash (everything except entryHash). */
type HashableEvent = Omit<AuditEvent, "entryHash">;

function hashEvent(e: HashableEvent): string {
  return createHash("sha256").update(canonicalJSON(e), "utf8").digest("hex");
}

/**
 * Append-only, hash-chained audit log. There is intentionally no update or
 * delete: the integrity of the AI-Disclosure Appendix depends on events never
 * being mutated. Each event carries the SHA-256 of its predecessor (`prevHash`)
 * and a hash of its own canonical content (`entryHash`), so any after-the-fact
 * edit or deletion is detectable via {@link verifyAuditChain}. A persistent
 * implementation maps `append` to an INSERT into the append-only `audit_events`
 * table (see supabase migration) and re-verifies the chain on read.
 *
 * The chain is keyed PER REPORT: each report has its own chain starting from the
 * genesis hash, so a single report's events ({@link forReport}) form a complete,
 * independently verifiable chain — which is exactly what one AI-Disclosure
 * Appendix discloses.
 */
export class AuditLog {
  private readonly events: AuditEvent[] = [];
  private readonly lastHashByReport = new Map<string, string>();

  append(args: RecordEventArgs): AuditEvent {
    const prevHash = this.lastHashByReport.get(args.reportId) ?? GENESIS_HASH;

    const base: HashableEvent = {
      id: genId(),
      reportId: args.reportId,
      sectionKey: args.sectionKey,
      prompt: args.prompt,
      model: args.model,
      modelVersion: args.modelVersion,
      inputIds: [...args.inputIds],
      output: args.output,
      createdAt: new Date().toISOString(),
      prevHash,
    };

    const event: AuditEvent = { ...base, entryHash: hashEvent(base) };
    // Freeze so callers cannot retroactively edit a recorded event.
    Object.freeze(event);
    Object.freeze(event.inputIds);
    this.events.push(event);
    this.lastHashByReport.set(args.reportId, event.entryHash);
    return event;
  }

  /** Returns a defensive copy ordered by insertion (chronological). */
  all(): AuditEvent[] {
    return [...this.events];
  }

  forReport(reportId: string): AuditEvent[] {
    return this.events.filter((e) => e.reportId === reportId);
  }

  forSection(reportId: string, sectionKey: ReportSectionKey): AuditEvent[] {
    return this.events.filter(
      (e) => e.reportId === reportId && e.sectionKey === sectionKey,
    );
  }
}

export interface ChainVerification {
  ok: boolean;
  /** Index of the first event that failed verification, or -1 if the chain is intact. */
  brokenAt: number;
  reason?: string;
}

/**
 * Recompute the chain over an ordered list of events and report the first break.
 * Detects three tampering modes: a mutated field (entryHash no longer matches),
 * a severed link (prevHash does not equal the prior entry's hash), and a removed
 * event (its successor's prevHash points at a hash no longer present).
 *
 * This makes the log tamper-EVIDENT, not tamper-proof: it proves the records
 * presented are internally consistent and unaltered since hashing, not that no
 * one with write access ever rewrote the whole chain.
 */
export function verifyAuditChain(events: AuditEvent[]): ChainVerification {
  let expectedPrev = GENESIS_HASH;
  for (let i = 0; i < events.length; i++) {
    const e = events[i]!;
    if (e.prevHash !== expectedPrev) {
      return {
        ok: false,
        brokenAt: i,
        reason: `event ${i} prevHash does not match the preceding entry`,
      };
    }
    const { entryHash, ...base } = e;
    if (hashEvent(base) !== entryHash) {
      return {
        ok: false,
        brokenAt: i,
        reason: `event ${i} content does not match its entryHash`,
      };
    }
    expectedPrev = entryHash;
  }
  return { ok: true, brokenAt: -1 };
}
