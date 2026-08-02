# Security Policy

Disclosed. structures forensic experts' own findings into Rule 26(a)(2)(B)
reports. Case material is litigation-sensitive, so we take security seriously and
welcome responsible disclosure.

## Reporting a vulnerability

Please email **security@disclosed.app** with:
- a description of the issue and its impact,
- steps to reproduce (a proof-of-concept if you have one),
- any affected URLs or components.

Please do **not** open a public issue for security reports, and please do not
access, modify, or exfiltrate data that isn't yours while testing. We aim to
acknowledge reports within a few business days.

## Scope

In scope: the web application, its API routes, authentication, the billing/credit
paths, and the report-grounding / audit-disclosure pipeline.

Out of scope: third-party providers we build on (Supabase, Stripe, Anthropic,
Vercel) — report those to the respective vendors.

## What we do today (commitments, not certifications)

We describe our posture honestly and avoid claiming certifications we do not hold:
- **No SOC 2 / ISO certification yet.** We do not claim one.
- **Confidentiality:** drafting uses the Anthropic API (no training on inputs by
  default); per-account isolation is enforced by Postgres row-level security.
- **Transport/storage:** HTTPS in transit; data at rest is encrypted by the
  managed database provider.
- **AI grounding:** the export pipeline refuses to produce a deliverable that
  contains a sentence not grounded in the expert's supplied evidence.

If a claim here ever drifts from reality, that itself is a bug — please report it.

## Verifying a disclosure record (independently)

Every report's AI-use record is an append-only SHA-256 hash chain. Anyone holding
a report's disclosure manifest can verify it **independently** — in their own
browser, with no account and nothing uploaded — at `/verify`. The exact algorithm
and a reference implementation are published in `docs/VERIFICATION.md`, so the
record can be checked without trusting us.

## Dependency notes

- **Spreadsheet parsing migrated off the unmaintained `xlsx` / SheetJS package
  (2026-06-18).** Uploaded spreadsheets are read entirely in the user's browser
  (the file never reaches our server). We now use `read-excel-file` — a
  maintained, **zero-dependency** OOXML reader for `.xlsx`/`.xlsm`. The old npm
  `xlsx` package carried unpatched prototype-pollution / ReDoS advisories with no
  fix on the npm registry; it has been removed, so `npm audit` no longer reports
  those highs. Legacy *binary* `.xls`/`.xlsb` are no longer parsed (no maintained
  pure-JS reader handles them without an unmaintained dependency) — they are
  declined with a "save as .xlsx" message.
- **The production dependency audit is clean.** `npm audit --omit=dev` reports
  **0 vulnerabilities**. Two pre-existing transitives — `form-data` (via
  `@anthropic-ai/sdk`) and `postcss` (via `next`) — are pinned to patched
  versions through `overrides` in `package.json`. The only items a *full*
  `npm audit` still lists are **dev-only test tooling** (`vitest`/`vite`/`esbuild`),
  a development-server-only advisory that never ships to production; clearing it
  needs a major `vitest` bump, deferred as higher-risk than the issue (see
  `DEFERRED.md`).

## Handling note

This document, like the product's legal pages, is informational and is not legal
advice.
