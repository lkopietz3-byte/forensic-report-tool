# DEPLOY.md — going live

The goal of this first deploy is narrow and important: get the **marketing site +
demo + design-partner application** live so the links in your outreach
(`/sample`, `/for-experts`, `/resources/…`) actually work and applications get
saved. It is **not** yet a deploy that should handle real case data under
protective order — see "Scope & guardrails" at the bottom.

Run the `RELEASE.md` gate first (typecheck · test · build · honesty pass).

---

## 1. Supabase (so waitlist + applications persist)

In production **without** Supabase the signup endpoint *fails closed* — it won't
write to disk, so applications would be lost. Wire it before launch.

1. Create a Supabase project. Copy from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` (server-only; never `NEXT_PUBLIC_`)
2. Run the migrations in order (SQL editor, or `supabase db push`):
   - `supabase/migrations/0001_init.sql` ← cases/reports/sections/audit + RLS
   - `supabase/migrations/0002_waitlist.sql`
   - `supabase/migrations/0003_waitlist_design_partner.sql` ← the application columns
   - `supabase/migrations/0004_persistence_and_billing.sql` ← builder persistence + audit hash cols + `subscriptions`
   - `supabase/migrations/0005_credits.sql` ← the per-report credit ledger
   - `supabase/migrations/0006_stripe_events.sql` ← webhook idempotency ledger
   - `supabase/migrations/0007_spend_credit.sql` ← atomic credit-spend function
   - `supabase/migrations/0008_perf_indexes.sql` ← list/audit query indexes
   - `supabase/migrations/0009_spend_credit_fingerprint.sql` ← one credit per report (not per download)
   - `supabase/migrations/0010_report_deliverable_style.sql` ← saved deliverable-style column
   - `supabase/migrations/0011_feedback.sql` ← in-app Help & feedback capture
   - `supabase/migrations/0012_templates_rls.sql` ← RLS on `templates` (security: the anon key ships to the browser, so without this anyone could overwrite section_schema)
   - `supabase/migrations/0013_spend_credit_status.sql` ← `spend_credit` returns text (`debited`/`already_paid`/`insufficient`). **REQUIRED before arming billing** — without it every credit-based export returns 503.
3. Sanity-check: the `waitlist` table has `email, discipline, source, role,
   reports_per_year, pain_point, ai_experience, must_have, notes, created_at`,
   RLS on, anon **insert-only** (reads happen via the service-role client).
4. **For sign-in + saved reports** (not just the public site): enable the
   **Email** auth provider, and under **Authentication → URL Configuration** set
   the **Site URL** to your domain and add redirect URLs
   `https://YOUR_DOMAIN/auth/callback` and `http://localhost:3000/auth/callback`.

To read applications: query `waitlist` where `source = 'for-experts'`, newest first.

> **Full step-by-step for auth + Stripe (with verification): `docs/SETUP-checklist.md`.**
> This file is the deploy-host summary; the checklist is the account-setup walk-through.

## 2. Environment variables (set in Vercel → Project → Settings → Env Vars)

Required for launch:
- `NEXT_PUBLIC_SITE_URL` = your domain, no trailing slash (drives sitemap, canonical, OG image, and outreach links)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

Optional — **live AI drafting**:
- `ANTHROPIC_API_KEY` + `ANTHROPIC_DRAFT_MODEL` (pin a dated snapshot) + `NEXT_PUBLIC_FF_LIVE_DRAFTING=1`.
  The demo and sample work fully **without** these (keyless deterministic mode).

Optional — **billing** (Stripe; see `docs/SETUP-checklist.md` §3):
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_PRO` (yearly subscription = the Pro tier), `STRIPE_PRICE_SINGLE` (1 credit), `STRIPE_PRICE_PACK5` (5 credits)
- `NEXT_PUBLIC_FF_BILLING=1` to **enforce** Pro/credits on export. Leave unset and export stays free for everyone (the gate code is present but unarmed).

Optional — `HEALTH_CHECK_TOKEN` gates the deep `/api/health?deep=1` check.

`.env.example` documents every variable; `/api/health?deep=1` returns a
presence-only (never values) view of which are set.

## 3. Deploy (Vercel)

- Import the repo. Framework auto-detects as **Next.js** (15.x). `vercel.json`
  already sets the region (`iad1`) and a 60s function `maxDuration` (covers
  PDF/DOCX export and the multi-write save path).
- The self-hosted OCR engine in `public/tesseract/` (~15 MB) ships as static
  assets — no function-size impact. The PDF/DOCX exporters are already handled by
  `next.config.mjs` (`serverExternalPackages: ["pdfkit"]`, font tracing).
- **After the first deploy, wire the Stripe webhook** (if using billing): add an
  endpoint at `https://YOUR_DOMAIN/api/billing/webhook` for events
  `checkout.session.completed`, `customer.subscription.created/updated/deleted`,
  then put its signing secret in `STRIPE_WEBHOOK_SECRET` and redeploy. Also set
  the Supabase Auth **redirect URL** to your live `…/auth/callback`.
- The webhook route reads the raw request body for signature verification — no
  special body-parser config is needed on Vercel (App Router passes it through).
- Confirm the production build succeeds in the Vercel logs.

## 4. Post-deploy smoke test (5 minutes, on the live URL)

- [ ] `/` loads; the `lg` nav and the mobile hamburger both work; no horizontal scroll on a phone.
- [ ] `/sample` renders; **Download PDF** and **Word (.docx)** both produce files.
- [ ] `/intake`: paste a paragraph → segments → "Structure section" → the
      AI-Disclosure record shows and grounding is clean. Upload a **PDF** and an
      **image** (OCR) — text extracts, OCR text is flagged "verify". *(CSP allows
      the self-hosted OCR; verified locally, re-confirm in prod.)*
- [ ] `/for-experts`: submit a **real** application → it appears in Supabase
      `waitlist` (`source = for-experts`) with the structured fields. Submit a
      **blank/one-word** one → it's refused (422), not stored.
- [ ] `/resources/ai-disclosure-in-expert-reports` loads. `/sitemap.xml`,
      `/robots.txt`, `/opengraph-image` all return; paste a link into Slack/X/
      LinkedIn → the branded OG card shows with the real domain.

## 5. Then: launch the outreach

The site being live unblocks `docs/design-partner-kit.md`. Send the first batch
pointing at `/sample` + `/for-experts`. Review applications in Supabase; offer
slots to the substantive ones.

---

## Scope & guardrails (read before pointing real cases at this)

This deploy is safe for the **public site, the demo, and waitlist/application
capture**. Before pointing **real, protective-order case files** at the
authenticated builder, here's the status of the pre-real-data gate from
`RELEASE.md`:

**Now in place:**
- RLS isolation (per-user policies on every table) **+ a cross-user isolation
  test** (`src/test/rls-isolation.test.ts` — runs once `TEST_SUPABASE_*` are set).
- Server-side billing/feature enforcement (`checkServerAccess` + the credit gate,
  armed by `NEXT_PUBLIC_FF_BILLING`).
- The append-only **persisted** audit chain, re-verified on read (hash columns in
  `0004`; `src/test/persistence.test.ts` proves tampering is detected after a
  save→load round trip).
- Stripe webhook **idempotency** — a `stripe_events` ledger (`0006`) hard-dedupes
  every event, on top of the already-idempotent grant/upsert handlers.
- A CSP per-request **nonce** on the case-data routes (`/workspace`, `/signin`,
  `/auth`): `src/middleware.ts` mints a nonce, threads it so Next applies it to
  its scripts, and serves `script-src 'self' 'nonce-…' 'wasm-unsafe-eval'` — no
  `'unsafe-inline'`. Static marketing pages keep the inline-allowing CSP (they
  carry no user data; a per-request nonce can't be threaded into build-time HTML).

**All items on the pre-real-data gate are now in place.** Remaining hardening is
ramp-only (e.g. raising `Strict-Transport-Security` `max-age` once every subdomain
is verified HTTPS, tightening `style-src`), not a blocker. Still keep the
`/intake` demo framed as a preview where **nothing is stored** until you've run
the live `docs/SETUP-checklist.md` verification on your own Supabase/Stripe.
