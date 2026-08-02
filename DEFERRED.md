# DEFERRED.md

Deliberately-postponed work. Listed here so it isn't mistaken for an oversight,
and so the blocker for each is explicit. Most items are gated on auth + database
+ billing + third-party accounts landing — not on effort.

## ✅ Since shipped (kept so the deferred→done history is visible)

- **Server-side enforcement of the free/Pro gate** — DONE. Export re-checks
  entitlement server-side (`checkServerAccess` + the atomic credit gate in
  `/api/report/export`), armed by `NEXT_PUBLIC_FF_BILLING`.
- **RLS isolation + cross-user-isolation test** — DONE. Policies in
  `0001_init.sql`; automated proof in `src/test/rls-isolation.test.ts` (runs
  against a real DB when `TEST_SUPABASE_*` are set).
- **Audit-chain DB persistence (append-only)** — DONE. Hash-chain fields persist
  via migration `0004`, INSERT-only RLS, `verifyAuditChain` re-runs on read
  (`/api/report/[id]`), and an empty chain reads as NOT verified.
- **Stripe webhook idempotency** — DONE. Signature-verified, `stripe_events`
  dedupe ledger (`0006`), credit grants idempotent by session id (`0005`),
  spends atomic (`0007`).
- **Waitlist design-partner columns** — DONE (migration `0003`).
- **CSP per-request nonce** — DONE (`src/middleware.ts` + `src/lib/security/csp.ts`),
  including `style-src-elem` hardening and Supabase `connect-src`.
- **HSTS ramp to 1 year** — DONE (`includeSubDomains`/`preload` deliberately later).
- **Dependency/tooling security refresh** — DONE. Next.js is pinned to the
  patched 15.5.21 release, PostCSS and Sharp are overridden to patched versions,
  the missing PDF encoding dependency is explicit, and Vitest is on 4.1.10.
  Both the runtime and full `npm audit` are clean.
- **Rendered buyer-UI polish** — DONE. The live browser pass normalized brand
  lockups and tertiary links, made disabled treatment consistent, removed
  scroll-linked opacity from document content, and kept the intake upload well
  intentionally distinct from editable fields.

## Blocked on auth + database

- **Shared case rooms / multi-contributor intake.** Let paralegals, associates, and
  the retaining attorney's office contribute evidence (never opinions) via a
  revocable, token-scoped guest link; the expert still confirms every unit and
  remains sole author. Provenance feeds the disclosure trail (chain of custody).
  Full build-ready design in `docs/collaboration-spec.md`. The homepage now
  describes this only as a firm-design-partner direction, not a live feature.

## Coverage check (loose-ends shipped; more on the roadmap)

- **Completeness / coverage prompting.** A private, ephemeral "second set of
  eyes" that asks the expert neutral questions about gaps in their OWN materials
  — never originating content. Mechanism #2 (loose-ends relational checks) is
  live on `/sample` (`src/lib/domain/coverage.ts`, panel in the sample page).
  Mechanism #1 (challenge-readiness checklist, `buildCoverageChecklist` +
  per-section `coveragePrompts` on the template) is also shipped. Deferred:
  mechanism #3 (private pre-draft prep questionnaire) — overlaps #1's bank and
  needs a real intake/workspace first. **Non-negotiable guardrail:** the coverage
  output must stay ephemeral — never logged to the `AuditLog`, never in the
  report or AI-Disclosure appendix, never persisted — because *CLF v. Shell*
  makes such records discoverable as methodology and a logged "we warned you"
  is an impeachment. `coverage.ts` takes no `AuditLog`; keep it that way. Full
  research-backed design + safe/unsafe phrasing in `docs/coverage-check-spec.md`.

## Known limits / next steps

- **Upload formats (now broad).** The "Try it" demo reads, all client-side
  (`src/app/intake/readDocumentFile.ts`, file never leaves the browser):
  PDF (pdfjs), Word .docx (mammoth), Excel .xlsx/.xlsm (read-excel-file), HTML (DOMParser),
  the plain-text family (.txt/.md/.csv/.tsv/.json/.xml/.yaml/.log…), and
  **images + scanned PDFs via OCR** (self-hosted Tesseract — engine + a compact
  English model served from `public/tesseract/`, no CDN; CSP carries
  `'wasm-unsafe-eval'`). OCR'd text is flagged "Read by OCR — check against the
  original," and a scanned PDF is OCR'd page-by-page (capped at MAX_OCR_PAGES).
  The expert can also **enter evidence by hand** when there's no document.
  Declined by design: RTF/.doc and legacy *binary* `.xls`/`.xlsb` (a hand-rolled
  parser would leak garbage, and the only library that reads binary `.xls` —
  SheetJS on npm — is unmaintained with unpatched advisories; a wrong read is
  worse than no read). Those are declined with a "save as .xlsx" message. Verified
  end-to-end under the production CSP with zero violations. Remaining future-only:
  multi-language OCR, a server vision pass for very large scans, and binary
  `.xls`/`.xlsb` via a converter if demand warrants.
- **Image evidence → figures (session-held).** An evidence item can carry a
  photo/diagram that renders as a numbered "Figures" section after the body
  (`figuresChildren` in `docx.ts`, `figuresSection` in `pdf.ts`; the export route
  collects `evidence[].imageData`). It's normal evidence — cited by id, grounding
  unchanged, and an image attached to an *uncited* claim is still 422-blocked
  (verified). Two deliberate limits: (1) **not persisted on save** — the pixels
  are stripped from the saved payload (the evidence text + cites + audit chain
  round-trip intact), so figures are re-attached on reopen; the Save toast says
  so. Persisting them needs object storage (base64 in the hashed input JSON would
  bloat the row and the audit chain). (2) **PNG-only**, re-encoded client-side and
  downscaled to clear the 800 KB schema cap — the exporters decode PNG IHDR for
  dimensions. JPEG support (better for real site photos) means teaching both
  exporters the JPEG path + widening the schema regex. Both are additive, not a
  rebuild.
- **Forwarded-email attachments as an intake channel.** Same `readDocumentFile()`
  parsing is the natural home for attachments once the contributor channel lands
  (see the collaboration spec); blocked on auth + inbound-mail infra, not parsing.

## Blocked on third-party accounts / traffic

- **Durable rate limiting.** `src/app/api/waitlist/route.ts` uses a per-instance
  in-memory limiter that resets on cold start. Move to a shared store (e.g.
  Upstash) when traffic justifies it.
- **Design-partner review + access.** Acceptance is currently manual (you read
  `.data/waitlist.jsonl` / Supabase rows). When auth lands, granting an accepted
  applicant access becomes a real account invite; until then the kit's copy sets
  the "reviewed, not instant" expectation.
- **Transactional email / double opt-in** for the waitlist (e.g. Resend).
- **Error tracking (Sentry) + log drain.** The structured logger
  (`src/lib/log/logger.ts`) has a single forwarding seam ready; needs a DSN.
- **Analytics taxonomy.** Define events before instrumenting, so the funnel is
  coherent from day one.

## Security hardening (remaining)

- **HSTS `includeSubDomains` + `preload`.** Now at 1-year `max-age`; add the
  flags + submit to hstspreload.org only after every subdomain is verified
  HTTPS-only (hard to undo).
- **Cross-instance rate limiting.** `src/lib/http/rateLimit.ts` is a pruned,
  per-instance speed-bump; back it with Upstash/Vercel KV when traffic justifies.
## Billing receipts (buyer expense workflow)

- **Emailed receipts + an in-app "receipt" affordance.** Experts pass costs to
  retaining counsel and want a forwardable receipt. Stripe can email receipts
  for one-time payments and invoices for subscriptions, but that is a Stripe
  *dashboard* setting we can't toggle from code — so the UI deliberately does
  NOT claim a receipt is emailed (honesty rule). Before launch: enable email
  receipts in the Stripe dashboard, confirm the customer portal exposes invoices
  for credit purchases, then surface a "receipt emailed · download invoices in
  Manage billing" line in the workspace billing block.

## Product scope (Phase 2+, per plan)

Case-management/e-discovery integrations, multi-discipline templates,
rebuttal/deposition-prep/demonstratives modules. Template-additive — not a
rebuild — but explicitly out of MVP scope.
