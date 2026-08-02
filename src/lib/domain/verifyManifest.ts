import type { AuditEvent } from "./types.js";

/**
 * Portable, dependency-free verifier for a Disclosed. AI-disclosure manifest.
 *
 * This is the INDEPENDENT, third-party half of the tamper-evidence story. It
 * recomputes the SHA-256 hash chain that {@link file://./audit.ts} produced, but
 * using the Web Crypto API (`globalThis.crypto.subtle`) instead of `node:crypto`,
 * so it runs in any modern browser with no account, no server round-trip, and no
 * trust in disclosed.app. Opposing counsel, a court, or the expert can confirm a
 * report's AI-use record was not altered after it was recorded.
 *
 * It MUST stay byte-for-byte compatible with `audit.ts`'s `hashEvent` /
 * `canonicalJSON` — `src/test/verifyManifest.test.ts` pins that parity against
 * the real `AuditLog`. The chain is tamper-EVIDENT, not tamper-proof: a pass
 * proves the presented records are internally consistent and unaltered since
 * they were hashed, not that no one with write access ever rewrote the whole
 * chain from genesis. Keep this module dependency-light (web standards only) so
 * it can also be the reference implementation a third party reimplements.
 */

/** Genesis link for the first event in a chain. Mirrors audit.ts. */
export const GENESIS_HASH = "0".repeat(64);
export const MANIFEST_FORMAT = "disclosed.ai-disclosure-manifest";
export const MANIFEST_VERSION = 1;

export interface DisclosureManifest {
  format: string;
  version: number;
  algorithm: {
    hash: "SHA-256";
    canonicalization: string;
    chain: string;
  };
  report: { matter?: string; generatedAt: string };
  /** The append-only audit chain, exactly as hashed. */
  events: AuditEvent[];
}

/**
 * Deterministic JSON: object keys sorted recursively so the same logical event
 * always serializes to the same bytes, regardless of property order. This MUST
 * match `audit.ts::canonicalJSON` exactly — the hashes depend on it.
 */
export function canonicalJSON(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(",")}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const body = keys
    .map((k) => `${JSON.stringify(k)}:${canonicalJSON((value as Record<string, unknown>)[k])}`)
    .join(",");
  return `{${body}}`;
}

async function sha256Hex(input: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto (crypto.subtle) is unavailable in this environment.");
  }
  const bytes = new TextEncoder().encode(input);
  const digest = await subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface ManifestVerification {
  ok: boolean;
  /** Index of the first event that failed verification, or -1 if the chain is intact. */
  brokenAt: number;
  reason?: string;
  /** Number of events checked. */
  count: number;
}

/**
 * Recompute the chain over an ordered list of events and report the first break.
 * Async because Web Crypto's digest is async. Mirrors `audit.ts::verifyAuditChain`
 * exactly — it detects a mutated field (entryHash no longer matches), a severed
 * link (prevHash != the prior entry's hash), and a removed event (its successor's
 * prevHash points at a hash no longer present).
 */
export async function verifyManifestChain(events: AuditEvent[]): Promise<ManifestVerification> {
  let expectedPrev = GENESIS_HASH;
  for (let i = 0; i < events.length; i++) {
    const e = events[i]!;
    if (!e || typeof e.entryHash !== "string" || typeof e.prevHash !== "string") {
      return { ok: false, brokenAt: i, reason: `event ${i} is missing its hash fields`, count: events.length };
    }
    if (e.prevHash !== expectedPrev) {
      return {
        ok: false,
        brokenAt: i,
        reason: `event ${i} prevHash does not match the preceding entry`,
        count: events.length,
      };
    }
    const { entryHash, ...base } = e;
    if ((await sha256Hex(canonicalJSON(base))) !== entryHash) {
      return {
        ok: false,
        brokenAt: i,
        reason: `event ${i} content does not match its entryHash`,
        count: events.length,
      };
    }
    expectedPrev = entryHash;
  }
  return { ok: true, brokenAt: -1, count: events.length };
}

/** Assemble a downloadable manifest from a report's matter and its audit events. */
export function buildManifest(
  report: { matter?: string },
  events: AuditEvent[],
  generatedAt: string,
): DisclosureManifest {
  return {
    format: MANIFEST_FORMAT,
    version: MANIFEST_VERSION,
    algorithm: {
      hash: "SHA-256",
      canonicalization:
        "Recursive key-sorted JSON over each event with its entryHash field removed, UTF-8 encoded.",
      chain:
        "entryHash = SHA-256(canonicalJSON(event without entryHash)). The first event's prevHash is 64 zeros; each later prevHash equals the previous event's entryHash.",
    },
    report: { matter: report.matter, generatedAt },
    events,
  };
}

/**
 * Structurally validate a pasted/uploaded manifest before verifying it. Returns
 * null on malformed input; the cryptographic work is done by verifyManifestChain.
 */
export function parseManifest(raw: unknown): DisclosureManifest | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  if (!Array.isArray(m.events)) return null;
  for (const e of m.events) {
    if (!e || typeof e !== "object") return null;
  }
  return m as unknown as DisclosureManifest;
}
