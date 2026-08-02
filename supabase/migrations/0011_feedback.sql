-- In-app "Help & feedback" capture. Public-insert only (no anon read); the
-- service-role client reads it for triage. Mirrors the waitlist RLS posture.

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  email text,
  source text,
  page text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_created on feedback (created_at);

alter table feedback enable row level security;

-- Anyone may submit (anon insert); nobody may read/update/delete via the
-- anon/authenticated roles. Reads happen only through the service-role client.
create policy "public feedback submit" on feedback
  for insert with check (true);
