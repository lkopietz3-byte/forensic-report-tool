-- Phase 0 schema. Mirrors src/lib/domain/types.ts.
-- Per-expert isolation via RLS; audit_events is append-only (no update/delete).

create extension if not exists "pgcrypto";

-- Expert profile is keyed to the Supabase auth user.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  credentials text not null default '',
  publications_last_10yr jsonb not null default '[]',
  prior_testimony_last_4yr jsonb not null default '[]',
  compensation_statement text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  matter text not null default '',
  retaining_counsel text not null default '',
  expert_role text not null default '',
  case_number text,
  created_at timestamptz not null default now()
);

create table if not exists inputs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  type text not null check (type in
    ('note','photo','deposition','police_report','calc','measurement','doc','engagement_letter')),
  raw_file_url text,
  extracted_text text,
  created_at timestamptz not null default now()
);

create table if not exists evidence_units (
  id uuid primary key default gen_random_uuid(),
  input_id uuid not null references inputs (id) on delete cascade,
  content text not null,
  location text not null,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  discipline text not null,
  template_version text not null,
  status text not null default 'draft' check (status in ('draft','in_review','final')),
  created_at timestamptz not null default now()
);

create table if not exists report_sections (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports (id) on delete cascade,
  section_key text not null,
  draft_text text not null default '',
  final_text text,
  cited_evidence_ids jsonb not null default '[]',
  ungrounded_flags jsonb not null default '[]',
  unique (report_id, section_key)
);

-- Append-only: integrity of the disclosure appendix depends on immutability.
create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports (id) on delete cascade,
  section_key text not null,
  prompt text not null,
  model text not null,
  model_version text not null,
  input_ids jsonb not null default '[]',
  output text not null,
  created_at timestamptz not null default now()
);

create table if not exists templates (
  discipline text not null,
  version text not null,
  section_schema jsonb not null,
  primary key (discipline, version)
);

-- Indexes
create index if not exists idx_cases_owner on cases (owner_id);
create index if not exists idx_inputs_case on inputs (case_id);
create index if not exists idx_evidence_input on evidence_units (input_id);
create index if not exists idx_reports_case on reports (case_id);
create index if not exists idx_sections_report on report_sections (report_id);
create index if not exists idx_audit_report on audit_events (report_id);

-- Row-level security: an expert can only see their own data.
alter table profiles enable row level security;
alter table cases enable row level security;
alter table inputs enable row level security;
alter table evidence_units enable row level security;
alter table reports enable row level security;
alter table report_sections enable row level security;
alter table audit_events enable row level security;

create policy "own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own cases" on cases
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own inputs" on inputs
  for all using (exists (select 1 from cases c where c.id = inputs.case_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from cases c where c.id = inputs.case_id and c.owner_id = auth.uid()));

create policy "own evidence" on evidence_units
  for all using (exists (
    select 1 from inputs i join cases c on c.id = i.case_id
    where i.id = evidence_units.input_id and c.owner_id = auth.uid()))
  with check (exists (
    select 1 from inputs i join cases c on c.id = i.case_id
    where i.id = evidence_units.input_id and c.owner_id = auth.uid()));

create policy "own reports" on reports
  for all using (exists (select 1 from cases c where c.id = reports.case_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from cases c where c.id = reports.case_id and c.owner_id = auth.uid()));

create policy "own sections" on report_sections
  for all using (exists (
    select 1 from reports r join cases c on c.id = r.case_id
    where r.id = report_sections.report_id and c.owner_id = auth.uid()))
  with check (exists (
    select 1 from reports r join cases c on c.id = r.case_id
    where r.id = report_sections.report_id and c.owner_id = auth.uid()));

-- Audit events: readable + insertable by the owner, but never updatable/deletable.
create policy "own audit read" on audit_events
  for select using (exists (
    select 1 from reports r join cases c on c.id = r.case_id
    where r.id = audit_events.report_id and c.owner_id = auth.uid()));

create policy "own audit insert" on audit_events
  for insert with check (exists (
    select 1 from reports r join cases c on c.id = r.case_id
    where r.id = audit_events.report_id and c.owner_id = auth.uid()));
-- (No update/delete policies => those operations are denied for all non-service roles.)
