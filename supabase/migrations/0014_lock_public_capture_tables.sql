-- All waitlist and feedback writes go through server API routes using the
-- service role. Direct anon/authenticated INSERT bypasses validation, honeypots,
-- rate limits, quality gates, and waitlist merge rules, so remove that older
-- pre-API permission completely. The service role retains its elevated access.

drop policy if exists "public waitlist signup" on public.waitlist;
drop policy if exists "public feedback submit" on public.feedback;

revoke all on table public.waitlist from anon, authenticated;
revoke all on table public.feedback from anon, authenticated;
