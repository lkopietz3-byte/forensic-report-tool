-- Webhook idempotency ledger. Stripe delivers at-least-once and retries on any
-- non-2xx, so the same event id can arrive more than once. This table is the
-- hard dedupe: the webhook records each handled event id (PK), and skips any id
-- it has already seen. Combined with the already-idempotent handlers (grants by
-- session id, subscription upserts by user_id), this gives exactly-once effect.

create table if not exists stripe_events (
  id text primary key,            -- Stripe event id (evt_...)
  type text not null,
  received_at timestamptz not null default now()
);

-- Service-role only: RLS enabled with NO policies => every non-service role is
-- denied. Nothing user-facing ever touches this table.
alter table stripe_events enable row level security;
