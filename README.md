# Disclosed. — Forensic Report Tool

Disclosed helps a forensic expert organize their own findings into a Rule 26(a)(2)(B)-oriented report. The workspace accepts expert-supplied evidence, builds a citation-marked draft, and records AI involvement in a tamper-evident disclosure log. **The expert must review every fact, opinion, number, citation, and conclusion before use.** The citation check verifies that referenced evidence IDs were supplied; it does not determine whether the evidence actually supports a sentence. Admissibility is for the court to decide.

**Intended first audience:** forensic vocational rehabilitation and earning-capacity experts. Other disciplines are prospective template extensions, not verified supported workflows. Medical/IME use is outside the stated scope.

## Why this exists
Expert reports need a traceable separation between an expert's own analysis, supplied evidence, and AI-assisted formatting. This project explores whether a structured workspace and disclosure record can reduce report-assembly work while preserving that separation. Customer demand, design-partner fit, and legal suitability remain unvalidated by the repository alone.

## Implemented in this repository

- **Report builder** (`/workspace`): enter or paste evidence, tag it to template sections, build a citation-marked preview, and export Word/PDF. A worked example and a session-only challenge-readiness self-check are available. Human review remains required.
- **Citation-ID gate:** the server checks the adopted text for `[[E:<id>]]` markers. Export returns **422 GROUNDING_BLOCKED** for sentences without an accepted marker or with an ID outside the supplied evidence set. A valid marker establishes a reference to a supplied ID, **not factual or semantic support**; the expert must inspect the source and sentence.
- **Disclosure record:** an append-only, hash-chained audit log feeds the AI-Disclosure Appendix. Stored hash fields are re-verified on read. This makes changes detectable within the checked chain; it is not proof that an expert's underlying statements are true.
- **Accounts + persistence:** Supabase magic-link auth and per-owner RLS policies are in the schema; live isolation requires a deployment-level check. The current app flow creates a new report record per save. Database owner policies still allow update/delete, so those records are not immutable.
- **Billing:** Stripe — one-time report credits (atomic spend via a locked RPC, first credit free), idempotent signature-verified webhooks. The former annual entitlement remains supported in code for compatibility but is not part of the public early-access offer while report volume is still being validated.
- **Security controls in source:** per-request CSP nonce on case-data routes, HSTS, security headers, rate limiting, and structured logging with redaction. The repository declares automated tests and gated live-database isolation tests; this README does not establish the security or configuration of a live deployment.

Keyless preview mode runs everything with zero env vars (deterministic structuring, session-only). `docs/SETUP-checklist.md` is the walk-through for turning on live AI / accounts / billing; `DEPLOY.md` is the deploy runbook; `RELEASE.md` is the ship gate.

## Develop

```
npm install
npm run dev        # http://localhost:3000 (keyless preview works out of the box)
npm run typecheck
npm run test       # vitest; TEST_SUPABASE_* enables the live-DB isolation suites
npm run build
```

## Boundaries before real case use

1. The tool is designed to organize expert-supplied material. Its citation-ID gate cannot verify the meaning, accuracy, completeness, or admissibility of a report; a qualified expert must review the final text against the underlying sources.
2. The disclosure log records specified application events and detects changes within its checked chain. It does not certify a case record as complete or tamper-proof.
3. Real case material may be confidential or subject to a protective order. Verify authorization, provider data handling, deployment configuration, and legal obligations before using it. The keyless worked example is the safer way to evaluate the interface.
4. Customer validation and legal review remain open. See `docs/honest-audit.md` for the project's dated self-assessment.

## Repo layout

```
forensic-report-tool/
├── CLAUDE.md                  ← working agreement and project instructions
├── DEPLOY.md / RELEASE.md / DEFERRED.md / SECURITY.md
├── docs/                      ← SETUP-checklist, honest-audit, design-partner kit, VOICE, specs
├── discovery/                 ← interview guide, outreach sourcing, contacts
├── supabase/migrations/       ← schema, RLS, billing, credits, idempotency, and indexes
├── src/lib/domain/            ← citation checks, audit, disclosure, reconstruction, rule26, readiness
├── src/lib/{draft,report,billing,security,http,log,supabase}/
├── src/app/workspace/         ← the report builder (the product)
├── src/app/api/               ← build/export/save + billing + intake routes
└── src/test/                  ← automated tests for domain and application behavior
```
