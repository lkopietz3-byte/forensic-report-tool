-- Close the one RLS gap. `templates` shipped with RLS OFF while the app exposes
-- a browser anon client (NEXT_PUBLIC_SUPABASE_ANON_KEY). With RLS off, anyone
-- with the anon key could not only READ but OVERWRITE/DELETE section_schema (the
-- JSONB that drives report drafting) — corrupting every generated report. The
-- other 12 tables already enable RLS; this brings templates in line.
--
-- templates is global reference data read server-side via the service role
-- (which bypasses RLS), so RLS-on with no policy (deny-all to anon/authenticated)
-- is correct and does not break the app — no app code reads it via the anon
-- client. If a browser anon read is ever needed later, add:
--   create policy "templates readable by signed-in users"
--     on public.templates for select to authenticated using (true);

alter table public.templates enable row level security;
