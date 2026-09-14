-- New saves are one transaction, with a report-owned profile and audit identity.
-- Existing rows remain legacy; no historical profile is invented or backfilled.
alter table public.reports add column profile_snapshot jsonb;
alter table public.reports add constraint reports_profile_snapshot_object
  check (profile_snapshot is null or jsonb_typeof(profile_snapshot) = 'object');

create function public.save_report_snapshot(
  p_meta jsonb, p_profile jsonb, p_evidence jsonb,
  p_report jsonb, p_sections jsonb, p_audit jsonb
) returns jsonb
language plpgsql security invoker set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_case uuid;
  v_input uuid;
  v_report uuid := (p_report->>'id')::uuid;
  v_count integer;
  v_row jsonb;
  v_key text;
begin
  if v_owner is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if jsonb_typeof(p_meta) is distinct from 'object'
    or jsonb_typeof(p_profile) is distinct from 'object'
    or jsonb_typeof(p_report) is distinct from 'object'
    or jsonb_typeof(p_evidence) is distinct from 'array'
    or jsonb_typeof(p_sections) is distinct from 'array'
    or jsonb_typeof(p_audit) is distinct from 'array'
    or v_report is null then
    raise exception 'Invalid snapshot payload' using errcode='22023';
  end if;
  if octet_length((jsonb_build_array(p_meta,p_profile,p_evidence,p_report,p_sections,p_audit))::text) > 8000000
    or jsonb_array_length(p_evidence) > 200
    or jsonb_array_length(p_sections) not between 1 and 30
    or jsonb_array_length(p_audit) > 30 then
    raise exception 'Snapshot size or cardinality invalid' using errcode='22023';
  end if;
  foreach v_key in array array['matter','retainingCounsel','expertRole'] loop
    if jsonb_typeof(p_meta->v_key) is distinct from 'string' then raise exception 'Invalid meta field' using errcode='22023'; end if;
  end loop;
  foreach v_key in array array['full_name','credentials','compensation_statement'] loop
    if jsonb_typeof(p_profile->v_key) is distinct from 'string' then raise exception 'Invalid profile field' using errcode='22023'; end if;
  end loop;
  foreach v_key in array array['publications_last_10yr','prior_testimony_last_4yr'] loop
    if jsonb_typeof(p_profile->v_key) is distinct from 'array' then raise exception 'Invalid profile list' using errcode='22023'; end if;
    if exists(select 1 from jsonb_array_elements(p_profile->v_key) x where jsonb_typeof(x) <> 'string') then raise exception 'Invalid profile item' using errcode='22023'; end if;
  end loop;
  foreach v_key in array array['discipline','template_version'] loop
    if jsonb_typeof(p_report->v_key) is distinct from 'string' then raise exception 'Invalid report field' using errcode='22023'; end if;
  end loop;
  for v_row in select value from jsonb_array_elements(p_evidence) loop
    foreach v_key in array array['ref_id','content','location'] loop
      if jsonb_typeof(v_row->v_key) is distinct from 'string' then raise exception 'Invalid evidence field' using errcode='22023'; end if;
    end loop;
    if coalesce(jsonb_typeof(v_row->'section_key'),'null') not in ('string','null') then raise exception 'Invalid evidence section' using errcode='22023'; end if;
  end loop;
  for v_row in select value from jsonb_array_elements(p_sections) loop
    foreach v_key in array array['section_key','draft_text'] loop
      if jsonb_typeof(v_row->v_key) is distinct from 'string' then raise exception 'Invalid section field' using errcode='22023'; end if;
    end loop;
    if coalesce(jsonb_typeof(v_row->'final_text'),'null') not in ('string','null') then raise exception 'Invalid final text' using errcode='22023'; end if;
    foreach v_key in array array['cited_evidence_ids','ungrounded_flags'] loop
      if jsonb_typeof(v_row->v_key) is distinct from 'array' then raise exception 'Invalid section list' using errcode='22023'; end if;
      if exists(select 1 from jsonb_array_elements(v_row->v_key) x where jsonb_typeof(x) <> 'string') then raise exception 'Invalid section item' using errcode='22023'; end if;
    end loop;
  end loop;
  for v_row in select value from jsonb_array_elements(p_audit) loop
    foreach v_key in array array['event_id','chain_report_id','section_key','prompt','model','model_version','output','created_at_iso','prev_hash','entry_hash'] loop
      if jsonb_typeof(v_row->v_key) is distinct from 'string' then raise exception 'Invalid audit field' using errcode='22023'; end if;
    end loop;
    if jsonb_typeof(v_row->'input_ids') is distinct from 'array' then raise exception 'Invalid audit inputs' using errcode='22023'; end if;
    if exists(select 1 from jsonb_array_elements(v_row->'input_ids') x where jsonb_typeof(x) <> 'string') then raise exception 'Invalid audit input' using errcode='22023'; end if;
    if (v_row->>'entry_hash') !~ '^[a-f0-9]{64}$' or ((v_row->>'prev_hash') <> '' and (v_row->>'prev_hash') !~ '^[a-f0-9]{64}$') then raise exception 'Invalid audit hashes' using errcode='22023'; end if;
  end loop;
  v_row := nullif(p_report->'deliverable_style','null'::jsonb);
  if v_row is not null then
    if jsonb_typeof(v_row) <> 'object' then raise exception 'Invalid style' using errcode='22023'; end if;
    if (v_row ? 'font' and v_row->>'font' not in ('default','times','sans','century'))
      or (v_row ? 'fontSizePt' and v_row->>'fontSizePt' not in ('11','12'))
      or (v_row ? 'lineSpacing' and v_row->>'lineSpacing' not in ('single','onehalf','double'))
      or (v_row ? 'headingNumbering' and v_row->>'headingNumbering' not in ('decimal','roman','none')) then raise exception 'Invalid style choice' using errcode='22023'; end if;
    foreach v_key in array array['includeCoverPage','includeDisclosure','includeMapping','includeReadiness','lineNumbers'] loop
      if v_row ? v_key and jsonb_typeof(v_row->v_key) <> 'boolean' then raise exception 'Invalid style flag' using errcode='22023'; end if;
    end loop;
    foreach v_key in array array['font','lineSpacing','headingNumbering','footerText','reportDate','coverLogo'] loop
      if v_row ? v_key and jsonb_typeof(v_row->v_key) <> 'string' then raise exception 'Invalid style text' using errcode='22023'; end if;
    end loop;
    if v_row ? 'fontSizePt' and jsonb_typeof(v_row->'fontSizePt') <> 'number' then raise exception 'Invalid style font size' using errcode='22023'; end if;
  end if;
  -- Hashed fields are preserved verbatim, but cannot refer to another report.
  if exists (select 1 from jsonb_array_elements(p_audit) with ordinality a(value,n)
    where a.value->>'chain_report_id' is distinct from v_report::text
       or (a.value->>'seq')::integer is distinct from (a.n-1)::integer) then
    raise exception 'Invalid snapshot audit identity or order' using errcode='22023';
  end if;

  insert into public.profiles(id,full_name,credentials,publications_last_10yr,prior_testimony_last_4yr,compensation_statement)
    values(v_owner,p_profile->>'full_name',p_profile->>'credentials',p_profile->'publications_last_10yr',p_profile->'prior_testimony_last_4yr',p_profile->>'compensation_statement')
    on conflict(id) do update set full_name=excluded.full_name,credentials=excluded.credentials,
      publications_last_10yr=excluded.publications_last_10yr,prior_testimony_last_4yr=excluded.prior_testimony_last_4yr,
      compensation_statement=excluded.compensation_statement;
  insert into public.cases(owner_id,matter,retaining_counsel,expert_role)
    values(v_owner,p_meta->>'matter',p_meta->>'retainingCounsel',p_meta->>'expertRole') returning id into v_case;
  insert into public.inputs(case_id,type,extracted_text) values(v_case,'note',null) returning id into v_input;
  insert into public.evidence_units(input_id,ref_id,content,location,section_key)
    select v_input,r.ref_id,r.content,r.location,r.section_key from jsonb_to_recordset(p_evidence)
      as r(ref_id text,content text,location text,section_key text);
  get diagnostics v_count = row_count;
  if v_count <> jsonb_array_length(p_evidence) then raise exception 'Incomplete evidence insert'; end if;
  insert into public.reports(id,case_id,discipline,template_version,status,deliverable_style,profile_snapshot)
    values(v_report,v_case,p_report->>'discipline',p_report->>'template_version','draft',nullif(p_report->'deliverable_style','null'::jsonb),p_profile);
  insert into public.report_sections(report_id,section_key,draft_text,final_text,cited_evidence_ids,ungrounded_flags)
    select v_report,r.section_key,r.draft_text,r.final_text,r.cited_evidence_ids,r.ungrounded_flags
    from jsonb_to_recordset(p_sections) as r(section_key text,draft_text text,final_text text,cited_evidence_ids jsonb,ungrounded_flags jsonb);
  get diagnostics v_count = row_count;
  if v_count <> jsonb_array_length(p_sections) then raise exception 'Incomplete section insert'; end if;
  insert into public.audit_events(report_id,seq,event_id,chain_report_id,section_key,prompt,model,model_version,input_ids,output,created_at_iso,prev_hash,entry_hash)
    select v_report,r.seq,r.event_id,r.chain_report_id,r.section_key,r.prompt,r.model,r.model_version,r.input_ids,r.output,r.created_at_iso,r.prev_hash,r.entry_hash
    from jsonb_to_recordset(p_audit) as r(seq integer,event_id text,chain_report_id text,section_key text,prompt text,model text,model_version text,input_ids jsonb,output text,created_at_iso text,prev_hash text,entry_hash text);
  get diagnostics v_count = row_count;
  if v_count <> jsonb_array_length(p_audit) then raise exception 'Incomplete audit insert'; end if;
  return jsonb_build_object('reportId',v_report,'caseId',v_case);
end;
$$;
revoke all on function public.save_report_snapshot(jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) from public,anon,service_role;
grant execute on function public.save_report_snapshot(jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) to authenticated;
