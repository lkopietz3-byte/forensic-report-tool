-- spend_credit previously returned a bare boolean for BOTH "debited now" and the
-- idempotent "already paid for this exact report content" (a Word-then-PDF
-- re-export of the same report). The export route refunds a credit when a render
-- fails after a spend — but on the already-paid path NO credit was debited this
-- call, so refunding leaked a free credit (export Word to debit 1, then force the
-- PDF re-export to fail → a +1 refund → net free report). Return a STATUS so the
-- route can refund a REAL debit only. Behaviour is otherwise identical.
--
-- CREATE OR REPLACE cannot change a function's return type, so drop first.
drop function if exists spend_credit(uuid, text);

create or replace function spend_credit(p_user uuid, p_fingerprint text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_user::text));

  -- Already paid for this exact report content => succeed without debiting.
  -- Refunds (reason='adjustment' carrying the same fingerprint) cancel a prior
  -- spend, so compare counts rather than mere existence — the ledger stays
  -- append-only.
  if p_fingerprint is not null and (
    (select count(*) from credit_ledger
      where user_id = p_user and reason = 'export'
        and export_fingerprint = p_fingerprint)
    >
    (select count(*) from credit_ledger
      where user_id = p_user and reason = 'adjustment'
        and export_fingerprint = p_fingerprint)
  ) then
    return 'already_paid';
  end if;

  select coalesce(sum(delta), 0) into v_balance
    from credit_ledger where user_id = p_user;

  if v_balance <= 0 then
    return 'insufficient';
  end if;

  insert into credit_ledger (user_id, delta, reason, export_fingerprint)
    values (p_user, -1, 'export', p_fingerprint);
  return 'debited';
end;
$$;

revoke all on function spend_credit(uuid, text) from public;
revoke all on function spend_credit(uuid, text) from anon;
revoke all on function spend_credit(uuid, text) from authenticated;
-- service_role (the trusted server) retains execute via its elevated grants.
