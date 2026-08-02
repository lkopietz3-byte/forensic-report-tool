-- Pre-launch waitlist capture. Public-insert only (no RLS read for anon);
-- the service-role client reads it for outreach.

create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  discipline text check (discipline in
    ('forensic_engineering','accident_reconstruction','vocational_rehabilitation','other')),
  source text,
  created_at timestamptz not null default now(),
  unique (email)
);

create index if not exists idx_waitlist_created on waitlist (created_at);

alter table waitlist enable row level security;

-- Anyone may sign up (anon insert), but nobody may read/update/delete via the
-- anon/authenticated roles. Reads happen only through the service-role client.
create policy "public waitlist signup" on waitlist
  for insert with check (true);
