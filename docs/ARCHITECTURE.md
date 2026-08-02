# ARCHITECTURE.md — The verification intelligence

How **Disclosed.** is built, and — more importantly — *where the integrity lives*.
The drafting is the cloneable part. This document is mostly about the part that
isn't: the closed-world grounding contract, the tamper-evident audit chain, and
the projections built on top of them (disclosure appendix, data→opinion
reconstruction, report-readiness verdict).

The one invariant, restated because everything below serves it: **the tool never
originates facts, opinions, numeric ranges, or citations.** Every layer here is
either an input the expert supplied, a verification of that input, or a
projection of the audit record. None of them can introduce content.

---

## Layering

```
                 ┌─────────────────────────────────────────────┐
  framework      │  Next.js App Router · React · API routes     │
  (replaceable)  │  src/app/**  · src/app/api/**                 │
                 └───────────────┬─────────────────────────────┘
                                 │ consumes (never bypasses)
                 ┌───────────────▼─────────────────────────────┐
  domain core    │  src/lib/domain/**  — framework-agnostic,    │
  (the moat)     │  dependency-light, unit-tested in isolation  │
                 │                                              │
                 │   grounding ─┐                               │
                 │   audit ─────┼─> disclosure                  │
                 │   rule26 ────┤   reconstruction              │
                 │   template ──┘   readiness  (composes ↑)     │
                 └───────────────┬─────────────────────────────┘
                                 │ rendered by
                 ┌───────────────▼─────────────────────────────┐
  export         │  src/lib/export/docx.ts → .docx deliverable  │
                 └─────────────────────────────────────────────┘
```

`src/lib/domain/**` carries no Next/Supabase/Anthropic imports, so the integrity
logic unit-tests without any of them present. That isolation is deliberate: the
moat must be verifiable in milliseconds, in CI, with no network. (See the
keyless preview-mode note in `CLAUDE.md`.)

---

## The closed-world grounding contract (`grounding.ts`)

The mechanism that makes "never originate" enforceable rather than aspirational.

- Report text cites evidence with `[[E:<id>]]` markers (`CITATION_RE`).
- Gaps the tool refuses to fill are surfaced as `[Expert input needed: …]`
  placeholders (`PLACEHOLDER_RE`) — never silently invented.
- `classifySentence()` labels each sentence `grounded | placeholder | ungrounded
  | invalid` (`invalid` — a cite to an id outside the supplied set — outranks
  `placeholder`, because a fabricated cite is the more dangerous failure).
- `checkGrounding(text, allowedIds)` returns the `GroundingResult`:
  `citedEvidenceIds`, `ungroundedSentences`, `invalidCitationSentences`,
  `placeholderSentences`, `isClean`.
- `extractAllCitedIds()` returns *raw* cites including never-supplied ones — this
  is what catches a model citing evidence it was never given.
- `stripCitationMarkers()` produces the reader-facing prose; the markers live on
  for the audit/appendix, not the signed page.

"Closed-world" means: the only ids that count as grounded are the ones fed to the
model for that section. Anything else is `invalid`, by construction.

The model boundary is enforced again in `prompts.ts`: the system prompt's
absolute rules ("use only the supplied evidence; cite every factual sentence;
never originate; emit a placeholder if insufficient"), plus
`sanitizeEvidenceText()` which neutralizes prompt-injection in the untrusted
evidence block (strips control chars, defangs existing markers and angle
brackets). Grounding is the verifier; the prompt is the first line.

---

## The tamper-evident audit chain (`audit.ts`)

Append-only, hash-chained, **per report**.

- Each `AuditEvent` records the model, version, prompt, the closed-world
  `inputIds`, and the output, plus `prevHash` (SHA-256 of the prior event) and
  `entryHash` (SHA-256 over its own canonical content).
- Canonicalization sorts object keys recursively so semantically identical events
  hash identically — the hash can't be gamed by key order.
- There is **no update and no delete.** Appended events are `Object.freeze`d.
- `verifyAuditChain()` recomputes the chain and reports the first break,
  detecting three tampering modes: a mutated field, a severed link, and a removed
  event.

This is **tamper-evident, not tamper-proof**: it proves the presented records are
internally consistent and unaltered since hashing — not that no one with full
write access ever rewrote the entire chain. The copy says exactly that, never
more (see `VOICE.md`).

> Persistence (deferred): map `append` to an INSERT into an append-only
> `audit_events` table with INSERT-only RLS (no UPDATE/DELETE grant), and re-run
> `verifyAuditChain` on read. Tracked in `DEFERRED.md`.

---

## Projections (each originates nothing)

Everything the expert and the court actually see is a *pure projection* of the
grounding results + the audit chain. Projections can't add facts; they only
re-present recorded ones.

### Disclosure appendix (`disclosure.ts`) — the moat's deliverable
`generateDisclosureAppendix(reportId, audit, evidence)` walks the report's audit
events into a structured record: the fixed disclosure statement, the distinct
models used, and per-section entries (model/version, the evidence sources fed,
timestamp), plus the `verifyAuditChain` integrity result. Built **only** from the
log, so it cannot drift from what actually happened.

### Data→opinion reconstruction (`reconstruction.ts`) — the challenge view
`reconstructOpinion()` answers the deposition/Daubert question "where did *this*
opinion come from?" For one section it separates:
- **`reliedOn`** — evidence the *adopted* (signed) text actually cites *and* that
  was fed to the model.
- **`fedButNotReliedOn`** — provided but not cited (considered, not relied on).
- **`reliedOnButNeverFed`** — cited in the signed text but *never fed to any model
  call for that section*. Under the closed-world contract this MUST be empty; a
  non-empty list is an **integrity alarm** — the exact fabrication failure mode
  the product guards against.

It distinguishes the evidence *fed* to the model from the evidence the *signed
text relies on* — the distinction a careful cross-examiner draws. Deterministic
profile sections (qualifications, prior testimony, compensation) involve no model
call, so they report `aiAssisted: false` and are not grounding-checked (checking
them would mis-flag every plain sentence).

### Report-readiness verdict (`readiness.ts`) — the composed pre-export check
`assessReadiness(rule26, reconstructions)` composes the other verifiers into one
verdict the UI and export can show at a glance. It **originates nothing** — it
only aggregates already-computed results into blockers vs. warnings:

- **Blockers** (export should not proceed): any Rule 26 element
  missing/empty/unresolved-ungrounded; any `reliedOnButNeverFed` (closed-world
  breach); any invalid-citation sentence; a failed audit-chain verification.
- **Warnings** (structurally ready, but expert action needed before signing):
  open `[Expert input needed: …]` items; ungrounded sentences in adopted text.

`ready` is true iff there are zero blockers. The verdict never asserts
admissibility — it reports internal-consistency checks; admissibility is the
court's determination.

### Rule 26 completeness (`rule26.ts`)
`validateRule26(sections, template)` checks all six Fed. R. Civ. P. 26(a)(2)(B)
elements are present and non-empty, and (by default) blocks when an
evidence-required section still has unresolved ungrounded sentences. It trusts
`section.ungroundedFlags` (computed closed-world at draft time against the exact
fed set) rather than re-deriving from text — re-deriving could only catch
ungrounded-by-absence, never the more dangerous invalid-citation class, so it
would weaken the gate.

---

## The drafting pipeline (the replaceable part)

`src/lib/draft/**` — `pipeline.ts` orchestrates Claude API calls
(`anthropic.ts` / `llm.ts`) per section using `prompts.ts`, recording an audit
event for every model call. Profile sections (qualifications, prior testimony,
compensation) are rendered **deterministically** from the expert's structured
profile (`renderProfileSection`) — never model-generated, so they carry no audit
event and no AI-disclosure entry. The app also runs in a **keyless preview mode**
(`sample.ts`) that exercises the entire domain core — grounding, audit, all four
projections — with fixed sample data and no API key, which is how the sample
deliverable and the browser preview work.

---

## Export (`export/docx.ts`)

Renders the report + AI-Disclosure Appendix + data→opinion mapping to a `.docx`
buffer (experts live in Word). Citation markers are stripped from the
reader-facing prose; the appendix carries the auditable record. Served at
`/api/export/sample` (Node runtime) as a downloadable deliverable, marked with a
SAMPLE notice so it can't be mistaken for a real filing. Test coverage:
`docx.test.ts` (buffer/PK-zip signature) and `exportRoute.test.ts` (route headers
+ download disposition).

---

## Where to be careful

The high-risk files and the release gate are authoritative in `CLAUDE.md` and
`RELEASE.md`. In short: any change to `grounding.ts`, `audit.ts`,
`disclosure.ts`, `rule26.ts`, `reconstruction.ts`, `readiness.ts`, or
`prompts.ts` must preserve the invariant — re-read it, and re-run those suites
specifically. A change that lets any of these introduce a fact, number, or
citation absent from supplied evidence is not a bug; it's the end of the product.
