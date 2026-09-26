# RELEASE.md

Release gate for **Disclosed.** Keep it boring and repeatable. The point is to
reduce the product's two existential risks — fabricated content and overclaiming —
through automated checks and human review.

## Every release

1. **Typecheck:** `npm run typecheck` — clean.
2. **Tests:** `npm run test` — green. The grounding, audit, disclosure, and
   rule26 suites are non-negotiable; a failure there blocks the release.
3. **Build:** `npm run build` — succeeds (catches `.js`-vs-extensionless import
   regressions that typecheck alone misses).
4. **Dependency audit:** `npm audit --omit=dev` — review current findings and
   resolve release-blocking exposure. A clean audit is dated evidence for the
   locked dependencies, not proof of the deployed revision or absence of risk.
5. **Honesty pass:** review every new or changed user-facing string against the
   honesty rules in `CLAUDE.md`. No "court-defensible/admissible/compliant" as a
   guarantee; "tamper-evident" not "tamper-proof"; "structure" not "draft
   opinions"; no claimed certs/contracts we don't hold.
6. **Grounding invariant:** if any high-risk file changed (`grounding.ts`,
   `audit.ts`, `disclosure.ts`, `reconstruction.ts`, `rule26.ts`,
   `readiness.ts`, `prompts.ts`), verify citation-ID checks still reject uncited
   or unknown-ID sentences, and review cited claims against their actual source
   content; an allowed ID alone does not prove support. Confirm the projections
   (disclosure appendix, data→opinion reconstruction, readiness verdict) only
   aggregate recorded results, never add new ones.

## Before the app first accepts real case data (not preview/sample)

Status of the gate:
- ✅ Server-side billing enforcement of the gated deliverables (the export gate in `/api/report/export`, armed by `NEXT_PUBLIC_FF_BILLING`).
- ✅ RLS policies and an automated cross-user-isolation test exist (`src/test/rls-isolation.test.ts`).
- ✅ Append-only persisted audit chain, re-verified on read (migration `0004`; an empty chain reads as unverified).
- ✅ CSP per-request nonce replacing 'unsafe-inline' in script-src (plus style-src-elem hardening).
- ✅ Stripe webhooks idempotent + signature-verified (`stripe_events` ledger, migration `0006`).
- ⬜ Run the cross-user-isolation test against the intended live database with `TEST_SUPABASE_*` before real case use; local tests skip this without credentials.
- ⬜ Verify the deployed revision uses the patched lockfile. The 2026-09-26
  candidate passed both local npm audits; the older base lockfile had five
  production-dependency findings (`SECURITY.md`).
- ⬜ **Written confidentiality terms + "no training on customer data" commitment — needs a LAWYER, not code.** This blocks real protective-order case files.

## End-to-end smoke (manual, before a milestone)

Run a real case file through intake → draft → disclosure appendix → DOCX export:
- every Rule 26(a)(2)(B) element present;
- every citation resolves to a supplied evidence unit **and** a reviewer checks
  that the cited source supports the associated claim;
- the audit chain verifies the presented records and reconstructs their
  recorded prompt/model/version/data→opinion mapping for a challenged opinion;
  compare that record with actual activity because chain validity alone does not
  prove completeness;
- a beachhead-discipline expert red-teams one report for template compliance.
