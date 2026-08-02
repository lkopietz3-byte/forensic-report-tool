-- Per-report credit ledger. The non-subscription way to pay: buy credits, each
-- export spends one. Append-only and SERVICE-WRITE-ONLY — a user can read their
-- own balance but cannot grant themselves credits (no insert policy), the same
-- trust posture as subscriptions.

create table if not exists credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Signed: +N for a grant/purchase, -1 for an export debit. Balance = sum(delta).
  delta integer not null,
  reason text not null check (reason in ('signup_grant','purchase','export','adjustment')),
  -- Stripe Checkout Session id for a purchase; the unique index below makes a
  -- replayed webhook a no-op (idempotent grant).
  stripe_session_id text,
  report_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_ledger_user on credit_ledger (user_id);

-- Idempotency: one ledger row per Stripe session (a replayed webhook can't
-- double-grant). NULLs (non-purchase rows) are allowed many times.
create unique index if not exists uniq_credit_session
  on credit_ledger (stripe_session_id) where stripe_session_id is not null;

-- The "first report free" grant: exactly one signup_grant per user, ever, even
-- under a race (concurrent first-balance reads).
create unique index if not exists uniq_signup_grant
  on credit_ledger (user_id) where reason = 'signup_grant';

alter table credit_ledger enable row level security;

create policy "own credit read" on credit_ledger
  for select using (user_id = auth.uid());
-- (No insert/update/delete policies => only the service role can write. Grants
--  come from the Stripe webhook; debits from the server-side export gate.)
