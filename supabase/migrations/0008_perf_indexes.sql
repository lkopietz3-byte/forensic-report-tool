-- Performance indexes for the query patterns the app actually runs.

-- /api/report/list orders the user's reports newest-first with a limit; without
-- this, Postgres sorts the full (RLS-filtered) set on every request.
create index if not exists idx_reports_created on reports (created_at desc);

-- /api/report/[id] re-reads a report's audit chain ordered by seq.
create index if not exists idx_audit_report_seq on audit_events (report_id, seq);
