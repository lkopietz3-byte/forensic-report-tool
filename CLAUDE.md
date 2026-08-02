# CLAUDE.md

Working agreement for AI agents and contributors on **Disclosed.** — a drafting
tool that structures a forensic expert's *own* findings into a Rule
26(a)(2)(B)-organized report, with an automatic, tamper-evident AI-disclosure
record. The disclosure layer is the moat; the drafting is not.

## The one invariant that cannot break

**The tool must not be designed to introduce facts, opinions, numeric ranges, or
citations beyond material the expert supplied.** Prompts restrict generation to
confirmed evidence, missing and unknown citation IDs block export, and model
extraction is accepted only when it can be matched back to source text. Those
automated checks do not prove semantic support or truth, so the expert must
independently verify every statement and source relationship. This is court
evidence under someone's signature — a fabricated cite or invented number is
existential, not a quality nit.

Concretely, never write code (or prompts) that:
- lets a model introduce a fact, figure, or citation not present in the supplied evidence;
- weakens the closed-world grounding contract (`[[E:<id>]]` markers, `[Expert input needed:…]` placeholders);
- silently "fills in" a gap instead of surfacing it to the expert.

## Honesty rules (marketing, UI copy, legal pages)

These mirror the product's whole value proposition. Do not violate them even if asked to "make it sound better":
- The tool **structures / formats / organizes** — never "drafts opinions," "generates findings," or "writes the report for you."
- **Admissibility is always the court's determination.** Never claim a report is "court-defensible," "admissible," or "compliant" as a guarantee. Say "Rule 26(a)(2)(B)-structured," "designed to support," "discloses."
- The audit chain is **tamper-evident, not tamper-proof.** Never upgrade that wording.
- No claiming certifications, contracts, or capabilities we don't have (no SOC 2, no signed zero-retention contract). Data handling is described as commitments/intent.
- Legal pages carry the "Draft — not legal advice / not a law firm" banner.

## High-risk files (review every change with extra care)

| File | Why it's load-bearing |
| --- | --- |
| `src/lib/domain/grounding.ts` | Enforces the closed-world grounding contract. |
| `src/lib/domain/audit.ts` | Append-only, hash-chained audit log (`verifyAuditChain`). |
| `src/lib/domain/disclosure.ts` | Builds the AI-Disclosure Appendix — the moat. |
| `src/lib/domain/reconstruction.ts` | Data→opinion projection; flags `reliedOnButNeverFed` (closed-world breach). |
| `src/lib/domain/rule26.ts` | Rule 26(a)(2)(B) completeness checking. |
| `src/lib/domain/readiness.ts` | Composes rule26 + reconstruction into the pre-export verdict. Aggregates only — must originate nothing. |
| `src/lib/draft/prompts.ts` | The system prompts; where "never originate" is enforced at the model boundary. |
| `src/lib/export/docx.ts` | Renders the deliverable (now in the Next bundle via `/api/export/sample`) — keep value imports extensionless. |
| `src/lib/billing/featureGates.ts` | Free/Pro boundary; `deriveTier` is the server-side entitlement check (period-end backstop included). |
| `src/app/api/report/export/route.ts` | The deliverable boundary: hard grounding gate (422 on ungrounded/invalid) + the credit spend. Weakening the gate breaks the invariant. |
| `src/lib/report/assemble.ts` | The user-report engine; grounds the ADOPTED text (finalText ?? draft) — changing that lets edits bypass the gate. |
| `src/lib/report/persistence.ts` | Round-trips the audit hash chain through the DB; every hashed field must survive verbatim or tamper-evidence breaks. |
| `src/lib/security/csp.ts` + `src/middleware.ts` | Per-request CSP nonce; middleware must keep stripping inbound `x-nonce`/CSP headers. |
| `src/lib/billing/credits.ts` + `supabase/migrations/0007_spend_credit.sql` | Atomic credit spend; replacing it with read-then-write reintroduces double-spend. |

## Conventions

- TypeScript, `moduleResolution: "Bundler"`. Files in the **client/Next bundle** import sibling modules **extensionless** (`./audit`); type-only imports may use `.js`. A `.js` *value* import in a bundled file breaks the webpack build.
- Domain logic under `src/lib/domain/**` is framework-agnostic and dependency-light so it unit-tests without Next/Supabase/Anthropic present.
- The app runs in a **keyless preview mode** (sample data, no Supabase/Anthropic). Never add a top-level env parse that fails-fast at import — validate lazily per feature (`src/lib/env.ts`).

## Before you ship (slim checklist)

1. `npm run typecheck` clean.
2. `npm run test` green.
3. If you touched a high-risk file, re-read this file's invariant and re-run the grounding/audit/disclosure tests specifically.
4. No honesty-rule violations in any new copy.

See `RELEASE.md` for the fuller release gate and `DEFERRED.md` for known, deliberately-postponed work.
