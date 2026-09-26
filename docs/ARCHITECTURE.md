# ARCHITECTURE.md — The verification intelligence

How **Disclosed.** is built, and — more importantly — *where the integrity lives*.
The drafting is the cloneable part. This document is mostly about the part that
isn't: the closed-world grounding contract, the tamper-evident audit chain, and
the projections built on top of them (disclosure appendix, data→opinion
reconstruction, report-readiness verdict).

The design invariant: **the tool should not originate facts, opinions, numeric
ranges, or citations beyond the expert's material.** The automated checks below
validate citation IDs and record consistency, not whether a cited source entails
a claim. Expert review of the report and its sources remains necessary.

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

The citation-ID check that supports the closed-world design; it does not verify
that the cited evidence supports the sentence.

- Report text cites evidence with `[[E:<id>]]` markers (`CITATION_RE`).
- The prompt instructs the model to surface gaps as `[Expert input needed: …]`
  placeholders (`PLACEHOLDER_RE`); this check recognizes those placeholders.
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

"Closed-world" here means that only IDs fed to the model for that section count
as valid citations. An allowed ID can accompany an unsupported or false claim;
`grounded` is a structural classification, not a factual finding.

The model is instructed in `prompts.ts` by the system prompt's rules ("use only
the supplied evidence; cite every factual sentence; never originate; emit a
placeholder if insufficient"). `sanitizeEvidenceText()` strips control chars
and defangs existing markers and angle brackets in untrusted evidence. The
prompt steers generation and the grounding check validates IDs; neither
guarantees semantic support or prevents every prompt injection.

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
  detecting a mutated field or severed link in the presented chain. A
  truncated or wholly rewritten chain may still verify without an independent
  trusted anchor.

This is **tamper-evident, not tamper-proof**: it checks internal consistency of
the presented records, not completeness, authorship, or whether someone with
full write access rewrote the chain. The copy says exactly that, never more
(see `VOICE.md`).

> Saved reports persist the audit fields in `audit_events` through
> `src/app/api/report/save/route.ts` and migration `0004`. The table has
> INSERT-only RLS policies for the signed-in owner; `/api/report/[id]`
> re-verifies the stored chain on read. This protects the presented record
> against accidental changes, but cannot prove that every activity was logged.

---

## Projections (each originates nothing)

Everything the expert and the court actually see is a *pure projection* of the
grounding results + the audit chain. Projections can't add facts; they only
re-present recorded ones.

### Disclosure appendix (`disclosure.ts`) — the moat's deliverable
`generateDisclosureAppendix(reportId, audit, evidence)` walks the report's audit
events into a structured record: the fixed disclosure statement, the distinct
models used, and per-section entries (model/version, the evidence sources fed,
timestamp), plus the `verifyAuditChain` integrity result. Built from the
recorded events, it reflects the log as presented; it cannot independently
prove that the log captures all activity.

### Data→opinion reconstruction (`reconstruction.ts`) — the challenge view
`reconstructOpinion()` answers the deposition/Daubert question "where did *this*
opinion come from?" For one section it separates:
- **`reliedOn`** — evidence the *adopted* text cites *and* that was recorded as
  fed to the model; the label does not prove substantive reliance.
- **`fedButNotReliedOn`** — recorded as provided but not cited.
- **`reliedOnButNeverFed`** — cited in the adopted text but *not recorded as fed to a model
  call for that section*. Under the closed-world contract this MUST be empty; a
  non-empty list is an **integrity alarm** — one citation-ID mismatch the product
  guards against. It does not detect an allowed ID attached to an unsupported
  claim.

It distinguishes evidence *recorded as fed* to the model from evidence the
adopted text *cites* — the distinction a careful cross-examiner draws. Deterministic
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
specifically. Preserve the structural checks and test them, while requiring
expert review for semantic support and factual accuracy.
