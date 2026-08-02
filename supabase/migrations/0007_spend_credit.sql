-- Atomic credit spend. The export gate previously did a read-balance-then-insert
-- across two round-trips with no lock, so two concurrent exports could both pass
-- on a single credit (double-spend), and a swallowed insert error gave a free
-- export. This function makes "check balance > 0 and debit" a single atomic,
-- per-user-serialized operation.
--
-- SECURITY DEFINER so it can write credit_ledger (which has no user insert
-- policy); EXECUTE is restricted to the service role (the trusted server path).

create or replace function spend_credit(p_user uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  -- Serialize concurrent spends for this user within the transaction so the
  -- balance read and the debit insert cannot interleave with another request.
  perform pg_advisory_xact_lock(hashtext(p_user::text));

  select coalesce(sum(delta), 0) into v_balance
    from credit_ledger where user_id = p_user;

  if v_balance <= 0 then
    return false;
  end if;

  insert into credit_ledger (user_id, delta, reason)
    values (p_user, -1, 'export');
  return true;
end;
$$;

revoke all on function spend_credit(uuid) from public;
revoke all on function spend_credit(uuid) from anon;
revoke all on function spend_credit(uuid) from authenticated;
-- service_role (the server) retains execute via its elevated grants.
