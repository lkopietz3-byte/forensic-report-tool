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
- **AI grounding:** the export pipeline blocks uncited sentences and citations
  with IDs outside the supplied evidence set. It does not determine whether an
  allowed source actually supports a claim; the expert must review that.

If a claim here ever drifts from reality, that itself is a bug — please report it.

## Verifying a disclosure record (independently)

Every report's AI-use record is an append-only SHA-256 hash chain. Anyone holding
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
