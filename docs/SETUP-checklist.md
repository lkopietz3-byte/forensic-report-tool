# Setup checklist — the "your turn" list

Everything in the codebase is wired, typechecked, tested, and **fails open**: with
no keys set, the app runs in keyless preview (sample data, session-only builder,
no sign-in, no billing). To switch on the three capabilities you just had built —
**live AI drafting**, **accounts + saved reports**, and **Stripe billing** — you
need to create a few third-party accounts and paste keys into `.env.local`
(copy from `.env.example`). This is the only work left, and it's all on your side.

Nothing here requires more code from me. Each block is independent — wire one,
some, or all.

---

## 0. What works with zero config (today)

- The full report builder at `/workspace` — enter evidence, build, preview, export Word/PDF.
- Grounding + the AI-Disclosure record (using the deterministic structurer, labeled honestly as `deterministic-structurer (no-ai-v1)`).
- All marketing pages, the sample report, intake/OCR (client-side, file never leaves the browser).

The three blocks below upgrade that baseline.

---

## 1. Live AI drafting  → richer section prose, real model in the disclosure record

| Var | Where to get it |
| --- | --- |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys (use an **API** key, so no-training/confidentiality terms apply) |
| `ANTHROPIC_DRAFT_MODEL` | Optional. Defaults to `claude-sonnet-4-5`. **In prod, pin a dated snapshot** (e.g. `claude-sonnet-4-5-20250929`) so the disclosure appendix records exactly what produced each section. |
| `NEXT_PUBLIC_FF_LIVE_DRAFTING` | Set to `1` to turn the live path on. Without the key it stays off (fail-closed). |

**Verify:** build a report in `/workspace`; the "AI-Disclosure record" should now
list your real model instead of `deterministic-structurer`. The closed-world
guarantee is unchanged — the model only ever sees the evidence you supplied and
must cite it, or the sentence is flagged.

---

## 2. Accounts + saved reports (Supabase)  → sign-in, persistence, the persisted audit chain

### 2a. Create the project & apply the schema
1. Create a project at https://supabase.com.
2. Run the migrations **in order** (Supabase SQL Editor, or `supabase db push` with the CLI):
   - `supabase/migrations/0001_init.sql`  (tables + RLS)
   - `supabase/migrations/0002_waitlist.sql`
   - `supabase/migrations/0003_waitlist_design_partner.sql`
   - `supabase/migrations/0004_persistence_and_billing.sql`  (builder persistence cols, audit hash cols, subscriptions table)
   - `supabase/migrations/0005_credits.sql`  (per-report credit ledger)
   - `supabase/migrations/0006_stripe_events.sql`  (webhook idempotency)
   - `supabase/migrations/0007_spend_credit.sql`  (atomic credit-spend function)
   - `supabase/migrations/0008_perf_indexes.sql`  (query indexes)
   - `supabase/migrations/0009_spend_credit_fingerprint.sql`  (credit covers a report, not a download)
   - `supabase/migrations/0010_report_deliverable_style.sql`  (saved deliverable-style column)
   - `supabase/migrations/0011_feedback.sql`  (in-app Help & feedback capture → the `feedback` table)
   - `supabase/migrations/0012_templates_rls.sql`  (RLS on `templates` — the anon key ships to the browser)
   - `supabase/migrations/0013_spend_credit_status.sql`  (`spend_credit` returns text — REQUIRED before billing, else credit exports 503)

### 2b. Turn on email magic-link auth
3. **Authentication → Providers → Email**: enable it. (Magic link / OTP — no passwords.)
4. **Authentication → URL Configuration**:
   - **Site URL**: your deployed origin (e.g. `https://disclosed.app`).
   - **Redirect URLs**: add `https://YOUR_DOMAIN/auth/callback` **and** `http://localhost:3000/auth/callback` for local dev.
5. (Optional but recommended for real email deliverability) configure a custom SMTP sender under **Authentication → Emails**; the built-in sender is rate-limited.

### 2c. Keys → env
| Var | Where |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon/public key (safe in the browser; RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role key — **server-only, never `NEXT_PUBLIC_`**. Used only by the Stripe webhook. |

**Verify:**
- Visit `/workspace` → "Sign in to save" appears → magic-link email arrives → clicking it lands you signed in.
- Build a report → **Save to my account** → reload → it appears under "Your saved reports" → **Open** → it rehydrates and the banner says **"Disclosure chain verified"** (the persisted hash chain re-verified on load).
- Run `npm run test:db` against a loopback Supabase migrated through `0016` using the variables and safety rules in `RELEASE.md`. Remote targets are refused; a skipped suite is not a pass.

---

## 3. Stripe billing → one-time report credits

New sales use **one-time credit packs**: one credit covers one report (Word + PDF
of the same content debit once). The first credit per account is granted free.
Legacy Pro rows remain recognized, but the app does not create new subscriptions.

### 3a. Products, prices, keys
1. https://dashboard.stripe.com (start in **test mode**).
2. **Products → add product** for each price you want, and copy each price id (`price_...`):
   - A **one-time** price for a single report → `STRIPE_PRICE_SINGLE` (grants 1 credit).
   - A **one-time** price for a 5-pack → `STRIPE_PRICE_PACK5` (grants 5 credits).
   (Set any subset — unset prices just hide that button. Credit amounts are fixed
   in code: single=1, pack5=5; the dollar amount is whatever you price in Stripe.)
3. **Developers → API keys**: copy the **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`, and the **Publishable key** (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

### 3b. Webhook (grants credits; also maintains any legacy subscriptions)
4. **Prod:** Developers → Webhooks → add endpoint `https://YOUR_DOMAIN/api/billing/webhook`, subscribe to:
   - `checkout.session.completed`  ← grants paid credits
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   Copy the endpoint's **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.
5. **Dev:** `stripe login` then `stripe listen --forward-to localhost:3000/api/billing/webhook` — it prints a `whsec_...` to use locally.

### 3c. Decide whether to ENFORCE payment on export
| Var | Effect |
| --- | --- |
| `NEXT_PUBLIC_FF_BILLING` | **Leave unset** → export stays free for everyone (current demo behavior; the gate code is present but not armed). Set to `1` → export requires an active **Pro** subscription **or** an available **credit** (debited per export), server-side. |

**Verify (test mode, with `4242 4242 4242 4242`, any future expiry/CVC):**
- **Subscription:** signed in → **Upgrade to Pro** → after redirect to `/workspace?upgraded=1`, the **Pro** badge shows and a `subscriptions` row exists. **Manage billing** opens the Stripe portal.
- **Credits:** **Buy 1 credit** / **Buy 5-pack** → after `/workspace?purchased=N`, the credit count rises and a `credit_ledger` row exists.
- **Enforcement (`NEXT_PUBLIC_FF_BILLING=1`):** a free account with credits can export (count drops by 1); at 0 credits export returns 402 `NEEDS_CREDIT`; a Pro account always succeeds. (Unit-covered by `gateWiring.test.ts` + `creditLedger.test.ts`.)

---

## 4. Full env var reference

```
# Live AI
ANTHROPIC_API_KEY=                 # console.anthropic.com
ANTHROPIC_DRAFT_MODEL=claude-sonnet-4-5   # pin a dated snapshot in prod
NEXT_PUBLIC_FF_LIVE_DRAFTING=1

# Supabase (auth + persistence)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (billing)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_SINGLE=              # one-time, grants 1 report credit
STRIPE_PRICE_PACK5=              # one-time, grants 5 report credits
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_FF_BILLING=            # 1 to enforce credits/legacy Pro; unset = export free

# Site / misc
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN   # canonical URLs, OG, Stripe redirects
HEALTH_CHECK_TOKEN=                # optional; gates /api/health?deep=1
```

Set the same vars in your host (e.g. Vercel project → Settings → Environment
Variables). See `DEPLOY.md` for the deploy walk-through.

---

## 5. Still deferred (honest list — these need more *code*, not just config)

These are intentionally out of scope for what was just built; flag me when you
want any of them:


- **Uploaded-file storage.** Intake parses files **in the browser** and never uploads them (a feature, for confidentiality). If you ever want server-side retention of source docs, that's a Supabase Storage + RLS task.
- **In-place report editing.** Each Save writes a new immutable snapshot (so the per-report audit chain is never mutated). "Update this report" vs. "save a new version" is a product decision, not built yet.
- **Stripe → email/receipt customization, tax, proration** — all default Stripe behavior today.

---

*Last updated alongside the live-AI / auth / persistence / billing build.*
