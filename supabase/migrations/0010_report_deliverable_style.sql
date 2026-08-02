-- Persist the deliverable formatting options chosen for a report, so reopening
-- a saved report restores the expert's font / spacing / numbering / appendix
-- choices instead of silently resetting to defaults.
--
-- This is display-only formatting JSON. It is NEVER part of the audit hash chain
-- (the chain hashes prompts/models/evidence, not presentation), so adding it
-- cannot affect tamper-evidence or the disclosure record.
alter table reports add column if not exists deliverable_style jsonb;
