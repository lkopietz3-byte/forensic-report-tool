-- Persistence for the report builder + a home for billing status.
-- Extends the Phase-0 schema (0001) without breaking existing RLS.

-- evidence_units: capture the builder's logical id ("E1") and the section the
-- expert assigned the unit to, so a saved report reloads into the builder
-- exactly as it was entered. (The normalized columns alone can't express
-- "which section did the expert put this in".)
alter table evidence_units add column if not exists ref_id text;
alter table evidence_units add column if not exists section_key text;

-- audit_events: store the exact hash-chain fields. The chain binds id /
-- chain_report_id / created_at / prev_hash into each entry's hash, so to keep
-- the log tamper-EVIDENT *across the persistence boundary* (recompute + compare
-- on read, detecting any post-hoc edit to prompt/output/model), those exact
-- values must survive the round trip. The table is already append-only (no
-- update/delete policies) — these columns make the cryptographic check real,
-- not just the DB-level immutability.
alter table audit_events add column if not exists event_id text;
alter table audit_events add column if not exists chain_report_id text;
alter table audit_events add column if not exists created_at_iso text;
alter table audit_events add column if not exists prev_hash text;
alter table audit_events add column if not exists entry_hash text;
-- Explicit append order within a report's chain. created_at can tie at ms
-- precision, so verification must re-read events in this exact order.
alter table audit_events add column if not exists seq integer;

-- subscriptions: Stripe status, so checkServerAccess() can derive the tier
-- server-side. RLS lets a user READ only their own row; there are deliberately
-- NO insert/update/delete policies, so only the service role (the Stripe
-- webhook) can write — a user cannot self-upgrade by writing this table.
create table if not exists subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text check (status in ('active','trialing','past_due','canceled','incomplete')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "own subscription read" on subscriptions
  for select using (user_id = auth.uid());
-- (No insert/update/delete policies => only the service role can write.)
