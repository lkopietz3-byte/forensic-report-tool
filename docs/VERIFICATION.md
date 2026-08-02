# Disclosure-manifest verification spec

Disclosed. produces, for every report, an **AI-disclosure manifest**: an
append-only, hash-chained record of how AI was used. This document specifies the
exact algorithm so the manifest can be verified **independently** — by opposing
counsel, a court, the expert, or any third party — without an account, without
calling our servers, and without trusting us.

A reference implementation is in
[`src/lib/domain/verifyManifest.ts`](../src/lib/domain/verifyManifest.ts) and the
browser tool is at `/verify`. The point of publishing this is that the record
holds up because it can be checked, not because we assert it.

## Manifest format

```jsonc
{
  "format": "disclosed.ai-disclosure-manifest",
  "version": 1,
  "algorithm": { "hash": "SHA-256", "canonicalization": "...", "chain": "..." },
  "report": { "matter": "Alvarez v. Brightline", "generatedAt": "2026-…Z" },
  "events": [ /* the audit chain, in order */ ]
}
```

Each element of `events` is one append-only audit event:

| field | meaning |
| --- | --- |
| `id` | opaque event id |
| `reportId` | the report this chain belongs to |
| `sectionKey` | which report section the event produced |
| `prompt` | the exact prompt sent to the model |
| `model`, `modelVersion` | the model and version used |
| `inputIds` | the evidence-unit ids provided (the closed-world input set) |
| `output` | the exact text the model returned |
| `createdAt` | ISO-8601 timestamp |
| `prevHash` | the previous event's `entryHash` (64 zeros for the first) |
| `entryHash` | SHA-256 over this event's canonical content (everything **except** `entryHash`) |

## Canonicalization

`canonicalJSON(value)` produces deterministic bytes so identical content always
hashes identically:

- `null`, numbers, strings, booleans → `JSON.stringify(value)`.
- arrays → `[` + each element canonicalized, comma-joined + `]`.
- objects → keys **sorted** ascending; each `JSON.stringify(key) : canonicalJSON(value)`,
  comma-joined, wrapped in `{ }`.

No insignificant whitespace. UTF-8 encoding.

## Hashing and the chain

For event *i*:

1. Let `base` = the event object **with the `entryHash` field removed**.
2. `entryHash_i = SHA-256( canonicalJSON(base) )`, lowercase hex.
3. `prevHash_0 = "0".repeat(64)`; for *i > 0*, `prevHash_i = entryHash_{i-1}`.

## Verification procedure

Walk the events in order, tracking `expectedPrev` (starts at 64 zeros):

1. If `event.prevHash != expectedPrev` → **broken at i** (a link was severed, or an
   event was inserted/removed).
2. Recompute `SHA-256(canonicalJSON(event without entryHash))`. If it
   `!= event.entryHash` → **broken at i** (a field was altered).
3. Set `expectedPrev = event.entryHash` and continue.

If the walk completes, the chain is intact.

## What a pass does and does not mean

A pass is **tamper-evident**: it proves the events presented are internally
consistent and unaltered since they were hashed, and that none was inserted,
removed, or reordered. It does **not**, on its own, prove that no one with write
access to the original store ever rewrote the entire chain from its first entry —
that is the limit of any self-contained hash chain. And whether any disclosure
satisfies a given court's requirements is always the court's determination.

## Reference (JavaScript, Web Crypto)

```js
const GENESIS = "0".repeat(64);
const canon = (v) =>
  v === null || typeof v !== "object" ? JSON.stringify(v)
  : Array.isArray(v) ? `[${v.map(canon).join(",")}]`
  : `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(",")}}`;
const sha256 = async (s) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))]
    .map((b) => b.toString(16).padStart(2, "0")).join("");

async function verify(events) {
  let prev = GENESIS;
  for (let i = 0; i < events.length; i++) {
    const { entryHash, ...base } = events[i];
    if (events[i].prevHash !== prev) return { ok: false, brokenAt: i };
    if ((await sha256(canon(base))) !== entryHash) return { ok: false, brokenAt: i };
    prev = entryHash;
  }
  return { ok: true, brokenAt: -1 };
}
```

The two static samples under `public/sample-disclosure-manifest*.json` (one intact,
one altered) exercise this and are pinned by `src/test/verifySample.test.ts`.
