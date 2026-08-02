# RELEASE.md

Release gate for **Disclosed.** Keep it boring and repeatable. The point is to
make the product's two existential risks — fabricated content and overclaiming —
impossible to ship by accident.

## Every release

1. **Typecheck:** `npm run typecheck` — clean.
2. **Tests:** `npm run test` — green. The grounding, audit, disclosure, and
   rule26 suites are non-negotiable; a failure there blocks the release.
3. **Build:** `npm run build` — succeeds (catches `.js`-vs-extensionless import
   regressions that typecheck alone misses).
4. **Honesty pass:** review every new or changed user-facing string against the
   honesty rules in `CLAUDE.md`. No "court-defensible/admissible/compliant" as a
   guarantee; "tamper-evident" not "tamper-proof"; "structure" not "draft
   opinions"; no claimed certs/contracts we don't hold.
5. **Grounding invariant:** if any high-risk file changed (`grounding.ts`,
   `audit.ts`, `disclosure.ts`, `reconstruction.ts`, `rule26.ts`,
   `readiness.ts`, `prompts.ts`), confirm the tool still cannot originate a fact,
   number, or citation absent from supplied evidence — and that the projections
   (disclosure appendix, data→opinion reconstruction, readiness verdict) only
   aggregate recorded results, never add new ones.

## Before the app first accepts real case data (not preview/sample)

Status of the gate:
- ✅ Server-side billing enforcement of the gated deliverables (the export gate in `/api/report/export`, armed by `NEXT_PUBLIC_FF_BILLING`).
- ✅ RLS isolation + automated cross-user-isolation test (`src/test/rls-isolation.test.ts` — RUN IT against the production Supabase by setting `TEST_SUPABASE_*` before launch).
- ✅ Append-only persisted audit chain, re-verified on read (migration `0004`; an empty chain reads as unverified).
- ✅ CSP per-request nonce replacing 'unsafe-inline' in script-src (plus style-src-elem hardening).
- ✅ Stripe webhooks idempotent + signature-verified (`stripe_events` ledger, migration `0006`).
- ⬜ **Written confidentiality terms + "no training on customer data" commitment — needs a LAWYER, not code.** The only open item; it blocks real protective-order case files.

## End-to-end smoke (manual, before a milestone)

Run a real case file through intake → draft → disclosure appendix → DOCX export:
- every Rule 26(a)(2)(B) element present;
- every citation resolves to a supplied evidence unit;
- the audit chain verifies and reconstructs prompt/model/version/data→opinion mapping for a challenged opinion;
- a beachhead-discipline expert red-teams one report for template compliance.
