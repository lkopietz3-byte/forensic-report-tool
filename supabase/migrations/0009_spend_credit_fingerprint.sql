-- One credit covers a REPORT, not a download. Exporting the same report as
-- Word and then PDF (or re-downloading after a hiccup) must not double-charge.
-- The export route fingerprints the report CONTENT (meta+evidence+sections,
-- format excluded); a repeat spend with the same fingerprint is a free no-op.

alter table credit_ledger add column if not exists export_fingerprint text;
create index if not exists idx_credit_fingerprint
  on credit_ledger (user_id, export_fingerprint) where export_fingerprint is not null;

create or replace function spend_credit(p_user uuid, p_fingerprint text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_user::text));

  -- Already paid for this exact report content => succeed without debiting.
  -- Refunds (reason='adjustment' carrying the same fingerprint, written when a
  -- render fails after a spend) cancel a prior spend, so compare counts rather
  -- than mere existence — the ledger stays append-only.
  if p_fingerprint is not null and (
    (select count(*) from credit_ledger
      where user_id = p_user and reason = 'export'
        and export_fingerprint = p_fingerprint)
    >
    (select count(*) from credit_ledger
      where user_id = p_user and reason = 'adjustment'
        and export_fingerprint = p_fingerprint)
  ) then
    return true;
  end if;

  select coalesce(sum(delta), 0) into v_balance
    from credit_ledger where user_id = p_user;

  if v_balance <= 0 then
    return false;
  end if;

  insert into credit_ledger (user_id, delta, reason, export_fingerprint)
    values (p_user, -1, 'export', p_fingerprint);
  return true;
end;
$$;

revoke all on function spend_credit(uuid, text) from public;
revoke all on function spend_credit(uuid, text) from anon;
revoke all on function spend_credit(uuid, text) from authenticated;

-- The old single-arg signature is superseded.
drop function if exists spend_credit(uuid);
