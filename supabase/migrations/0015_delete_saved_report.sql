-- Preserve the existing owner-confirmed deletion policy without allowing a
-- report delete to erase siblings. No retention policy is introduced here.
create or replace function public.delete_saved_report(p_report_id uuid)
returns text
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_case uuid;
  v_locked_case uuid;
  v_deleted uuid;
begin
  if v_owner is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  -- First discover, then lock parent before child: matches FK cascade order.
  select r.case_id into v_case
    from public.reports r join public.cases c on c.id = r.case_id
    where r.id = p_report_id and c.owner_id = v_owner;
  if not found then return 'not_found'; end if;

  perform 1 from public.cases c
    where c.id = v_case and c.owner_id = v_owner for update;
  if not found then return 'not_found'; end if;

  -- The report may have moved/disappeared while the parent lock was pending.
  select r.case_id into v_locked_case from public.reports r
    where r.id = p_report_id for update;
  if not found or v_locked_case <> v_case then return 'not_found'; end if;

  -- Parent FOR UPDATE blocks new FK references until this transaction ends.
  if (select count(*) from public.reports r where r.case_id = v_case) <> 1 then
    return 'shared_case';
  end if;

  delete from public.cases c where c.id = v_case and c.owner_id = v_owner
    returning c.id into v_deleted;
  if v_deleted is null then return 'not_found'; end if;
  return 'deleted';
end;
$$;
revoke all on function public.delete_saved_report(uuid) from public, anon, service_role;
grant execute on function public.delete_saved_report(uuid) to authenticated;
comment on function public.delete_saved_report(uuid) is
  'Owner-scoped atomic deletion of a sole-report case snapshot. Refuses shared cases; does not promise indefinite audit retention.';
