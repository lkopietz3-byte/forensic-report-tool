# GO-LIVE — the one sequenced runbook

The single do-this-now list. `DEPLOY.md` and `docs/SETUP-checklist.md` have the
detail; this is the order you actually do it in, top to bottom, no doc-hopping.

**The point of the first deploy:** get the public site + the sample + the
`/for-experts` application live so the links in your 10 emails work and applications
get saved. That's it. **Live AI drafting and Stripe billing are optional and can wait
— do NOT let them block launch.** (The builder runs in keyless deterministic mode and
export is free until you arm billing.)

**Time:** ~30 minutes, most of it waiting on Supabase + Vercel.

---

## Pre-flight (2 min) — the gate is already green

Last run this session: **typecheck clean · 501 tests · prod build OK (32/32 pages).**
A pre-deploy adversarial audit also hardened the existential grounding gate (colon /
unbalanced-bracket laundering closed), renamed the duplicate `0010` credit-status
migration to `0013` (now in the list below), tied export auth to the model boundary,
and added an export staleness guard. Re-run if you touched anything since:

```
export PATH="$HOME/.local/node/bin:$PATH"
npm run typecheck && npm test && npm run build
```

Also do the honesty pass (no "court-defensible/admissible/compliant/guaranteed" in any
new copy). Then proceed.

---

## Step 1 — Supabase (so applications persist)  ~10 min

In prod **without** Supabase, `/for-experts` fails closed and applications are lost.
Wire it first.

- [ ] Create a project at https://supabase.com.
- [ ] **SQL Editor** → run the 14 migrations **in order** (paste each, run, next):
      `0001_init` · `0002_waitlist` · `0003_waitlist_design_partner` ·
      `0004_persistence_and_billing` · `0005_credits` · `0006_stripe_events` ·
      `0007_spend_credit` · `0008_perf_indexes` · `0009_spend_credit_fingerprint` ·
      `0010_report_deliverable_style` · `0011_feedback` · `0012_templates_rls` ·
      `0013_spend_credit_status` (**required before billing** — else credit exports 503) ·
      `0014_lock_public_capture_tables` (**required before launch** — removes direct
      anon writes that bypass API validation, honeypots, and rate limits)
      (files in `supabase/migrations/`).
- [ ] **Authentication → Providers → Email**: enable (magic link / OTP). *(Needed for
      sign-in + saved reports. The public site + application don't require a login, but
      turn it on now so the builder's Save works.)*
- [ ] **Authentication → URL Configuration**: Site URL = your domain; add Redirect URLs
      `https://YOUR_DOMAIN/auth/callback` **and** `http://localhost:3000/auth/callback`.
- [ ] **Project Settings → API** — copy three values for Step 2:
      Project URL · `anon` public key · `service_role` secret key.

## Step 2 — Vercel (deploy)  ~10 min

- [ ] Import the repo. Framework auto-detects **Next.js**; `vercel.json` already sets
      region + 60s function `maxDuration`. No build config to touch.
- [ ] **Settings → Environment Variables** — set the launch-minimum set:
      ```
      NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN        # no trailing slash
      NEXT_PUBLIC_SUPABASE_URL=...
      NEXT_PUBLIC_SUPABASE_ANON_KEY=...
      SUPABASE_SERVICE_ROLE_KEY=...                    # server-only, never NEXT_PUBLIC_
      ```
- [ ] Deploy. Confirm the build succeeds in the Vercel logs.
- [ ] Set the Supabase **Site URL / redirect** to the real domain if it changed.

## Step 3 — Smoke test on the live URL (5 min)

- [ ] `/` loads; desktop nav + mobile hamburger work; no horizontal scroll on a phone.
- [ ] `/sample` renders; **Download PDF** and **Word (.docx)** both produce files.
- [ ] `/workspace`: load the worked example → **Build & preview** → grounding is clean,
      the AI-Disclosure record shows → **Download Word**.
- [ ] `/for-experts`: submit a **real** application → row appears in Supabase `waitlist`
      (`source` starts with `for-experts`; discipline-preview entries include the
      discipline in the source). Submit a **blank/one-word** one → refused (422),
      not stored. Also verify that a prior lightweight signup with the same email
      is upgraded with the full application rather than duplicated or ignored.
- [ ] `/resources/ai-disclosure-in-expert-reports`, `/sitemap.xml`, `/robots.txt`,
      `/opengraph-image` all return. Paste your domain into Slack/LinkedIn → the OG card
      shows the real domain.

## Step 4 — Launch the outreach (the actual point)

- [ ] Drop the real domain into the links in `docs/outreach-batch-1.md`.
- [ ] Send the first batch (start with the warm ones). Log them in the tracker.
- [ ] Follow up day 4 and day 10. Book every call that replies.

**Tripwire: if zero emails go out, the deploy didn't matter.** Shipping the site is the
means; the 10 sends are the goal.

---

## Optional — turn on later, not before launch

**Live AI drafting** (richer prose, real model name in the disclosure record):
set `ANTHROPIC_API_KEY`, pin `ANTHROPIC_DRAFT_MODEL` to a dated snapshot, and
`NEXT_PUBLIC_FF_LIVE_DRAFTING=1`. Without it, the deterministic structurer runs and is
labeled honestly. *(SETUP-checklist §1.)*

**Stripe billing** (only when you have someone ready to pay): create the 3 prices, set
the keys, add the webhook at `…/api/billing/webhook`, then `NEXT_PUBLIC_FF_BILLING=1` to
enforce. Leave it unset and export stays free. *(SETUP-checklist §3.)*

---

## Before you point REAL, protective-order case files at the builder

Per `DEPLOY.md`, every pre-real-data security item is **already in place** (RLS +
isolation test, persisted hash-chained audit re-verified on read, CSP per-request nonce
on the case-data routes, Stripe webhook idempotency). Two things to actually do first:
run the isolation test against your live DB (set `TEST_SUPABASE_*`, `npm test` →
`rls-isolation.test.ts` runs), and keep the `/intake` demo framed as "nothing is
stored." Remaining hardening (HSTS `includeSubDomains`/`preload`, tighter `style-src`)
is ramp-only, not a blocker.
