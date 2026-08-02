-- Design-partner application fields captured by the /for-experts form. All
-- nullable; a plain waitlist signup leaves them null. Without these columns the
-- service-role upsert in src/app/api/waitlist/route.ts errors on unknown keys.

alter table waitlist
  add column if not exists role text,
  add column if not exists reports_per_year text,
  add column if not exists pain_point text,
  add column if not exists ai_experience text,
  add column if not exists must_have text,
  add column if not exists notes text;

-- Keep reports_per_year to the values the form can submit (null = not answered).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'waitlist_reports_per_year_check'
  ) then
    alter table waitlist
      add constraint waitlist_reports_per_year_check
      check (reports_per_year is null
        or reports_per_year in ('1-3','4-10','11-25','25+'));
  end if;
end $$;

-- Find design-partner applications fast when reviewing.
create index if not exists idx_waitlist_source on waitlist (source);
