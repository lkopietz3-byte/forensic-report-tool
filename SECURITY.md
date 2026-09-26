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
access, modify, or exfiltrate data that isn't yours while testing. The repository
does not establish a response-time commitment; if delivery fails, contact the
repository owner privately before sharing sensitive details elsewhere.

## Scope

In scope: the web application, its API routes, authentication, the billing/credit
paths, and the report-grounding / audit-disclosure pipeline.

Out of scope: third-party providers we build on (Supabase, Stripe, Anthropic,
Vercel) — report those to the respective vendors.

## What we do today (commitments, not certifications)

We describe our posture honestly and avoid claiming certifications we do not hold:
- **No SOC 2 / ISO certification yet.** We do not claim one.
- **AI data path:** when AI drafting is enabled, selected case material is sent
  to the Anthropic API. Provider retention and account-specific terms need
  verification before real case use; the early-access path is limited to
  fictional or de-identified material.
- **Account isolation:** the repository defines per-owner Postgres row-level
  security policies. The live database configuration and cross-user isolation
  have not been verified by the automated suite without test credentials.
- **Transport/storage:** the app is designed for HTTPS and managed database
  encryption. This repository alone does not verify the live deployment or
  provider configuration.
- **AI grounding:** the export pipeline blocks uncited sentences and citations
  with IDs outside the supplied evidence set. It does not determine whether an
  allowed source actually supports a claim; the expert must review that.

If a claim here ever drifts from reality, that itself is a bug — please report it.

## Verifying a disclosure record (independently)

The app records AI-use events in a SHA-256 hash chain and restricts ordinary
account writes to insert/read in the supplied database policies. Anyone holding
a report's disclosure manifest can verify it **independently** — in their own
browser, with no account and nothing uploaded — at `/verify`. The exact algorithm
and a reference implementation are published in `docs/VERIFICATION.md`, so the
presented record can be checked for internal hash consistency without
trusting us. This check does not establish that the record is complete or who
authored the report.

## Dependency notes

- **Spreadsheet parsing changed on 2026-06-18.** Uploaded `.xlsx`/`.xlsm`
  spreadsheets are parsed in the user's browser with `read-excel-file` before
  evidence text is submitted. This package has transitive dependencies, including
  `@xmldom/xmldom`, so it must be included in dependency reviews. Legacy binary
  `.xls`/`.xlsb` files are declined with a "save as .xlsx" message.
- **Dependency audit, 2026-09-26.** The earlier base lockfile reported five
  production-dependency findings: one critical, three high, and one moderate.
  This candidate updates the affected packages; fresh local `npm audit --omit=dev`
  and full `npm audit` both reported **zero findings** for its lockfile. An audit
  result does not prove a live deployment uses these versions or that no other
  vulnerability exists. Confirm the exact deployed revision and rerun the audit
  as advisories change.

## Handling note

This document, like the product's legal pages, is informational and is not legal
advice.
