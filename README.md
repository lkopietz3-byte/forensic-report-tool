# Disclosed. — Forensic Report Tool

An AI tool that **structures** a forensic expert witness's **own** findings into a Rule 26(a)(2)(B)-organized report — formatting and organizing, never inventing facts, opinions, numbers, or citations — with an automatic, **tamper-evident** AI-Disclosure record as the moat. Admissibility is always the court's determination; the tool produces the disclosure, not the verdict. (Copy and terminology rules: `docs/VOICE.md`; the working agreement and the one invariant: `CLAUDE.md`.)

**Beachhead:** forensic **vocational rehabilitation / earning-capacity** experts (CRC/ABVE, RAPEL method). Next disciplines (template-additive): accident reconstruction (ACTAR), forensic engineering. No medical/IME (PHI/HIPAA + crowded).

## Why this exists (one paragraph)
Six waves of market research narrowed the thesis to forensic expert-witness report structuring. The product is built around a credible but still unvalidated pain: experts perform high-value professional work while manually assembling reports, and recent rulings make it increasingly important to preserve a clear record of how AI touched expert methodology. The business case still depends on interviews, a design partner, and paid-pilot evidence; desk research is not treated as customer proof.

## What's implemented locally

- **Report builder** (`/workspace`): enter or paste evidence, tag it to template sections, build a fully cited preview, export Word/PDF. One-click worked example; private (never-persisted) challenge-readiness self-check.
- **The invariant, enforced server-side:** closed-world `[[E:<id>]]` grounding; export returns **422 GROUNDING_BLOCKED** if any sentence is ungrounded or cites unfed evidence — checked on the *adopted* text, so edits can't bypass it.
- **The moat:** append-only, hash-chained audit log → AI-Disclosure Appendix; persisted with its hash fields and **re-verified on read** (tamper-evident across the DB boundary).
- **Accounts + persistence:** Supabase magic-link auth; RLS isolates every row per expert; saves are immutable snapshots.
- **Billing:** Stripe — one-time report credits (atomic spend via a locked RPC, first credit free), idempotent signature-verified webhooks. The former annual entitlement remains supported in code for compatibility but is not part of the public early-access offer while report volume is still being validated.
- **Security:** per-request CSP nonce on case-data routes, HSTS, strict headers, rate limiting, structured logging with redaction, and ordinary plus gated disposable-database tests. Production verification and legal readiness are separate gates.

Keyless preview mode runs everything with zero env vars (deterministic structuring, session-only). `docs/SETUP-checklist.md` is the walk-through for turning on live AI / accounts / billing; `DEPLOY.md` is the deploy runbook; `RELEASE.md` is the ship gate.

## Develop

```
npm install
npm run dev        # http://localhost:3000 (keyless preview works out of the box)
npm run typecheck
npm run test       # ordinary suite; database suites may be explicitly skipped
npm run test:db-runner # runner guards, including real Vitest env isolation
npm run test:db:disposable -- /absolute/new-run # existing local Docker required
npm run test:db    # manually configured required DB gate; see RELEASE.md
npm run build
```

## The non-negotiables

1. **Never generate facts or opinions** — only structure the expert's own inputs. One hallucination in court ends the business.
2. **The AI-disclosure/audit layer is the moat** — it ships in everything, never gets bypassed.
3. **Honest copy, always** — "structures" not "drafts opinions"; "tamper-evident" never "tamper-proof"; admissibility is the court's call.
4. **Confidentiality must be proven, not merely claimed** — case files may be privileged or under protective order. Do not promise "no training" or contractual protections until the configured provider and written terms support the exact claim.
5. **Validation over features** — the open risks are customers, a design partner, and legal review, not code. See `docs/honest-audit.md`.

## Repo layout

```
forensic-report-tool/
├── CLAUDE.md                  ← working agreement + the one invariant
├── DEPLOY.md / RELEASE.md / DEFERRED.md / SECURITY.md
├── docs/                      ← SETUP-checklist, honest-audit, design-partner kit, VOICE, specs
├── discovery/                 ← interview guide, outreach sourcing, contacts
├── supabase/migrations/       ← 0001–0016 (schema, RLS, billing, credits, idempotency, intake lockdown, atomic deletion)
├── src/lib/domain/            ← the moat: grounding, audit, disclosure, reconstruction, rule26, readiness
├── src/lib/{draft,report,billing,security,http,log,supabase}/
├── src/app/workspace/         ← the report builder (the product)
├── src/app/api/               ← build/export/save + billing + intake routes
└── src/test/                  ← ~32 suites; grounding/audit/disclosure suites are non-negotiable
```
