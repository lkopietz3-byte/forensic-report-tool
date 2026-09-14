import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AuditLog, verifyAuditChain } from "@/lib/domain/audit";
import { auditRowsToEvents } from "@/lib/report/persistence";
import { SUPABASE_TEST_TARGET_SAFE, TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_SERVICE_ROLE_KEY, REQUIRE_SUPABASE_INTEGRATION, supabaseTestGateFailures } from "./supabaseTestTarget";
const suite=SUPABASE_TEST_TARGET_SAFE?describe:describe.skip;
it("requires the configured local schema when the save gate is requested",()=>{if(REQUIRE_SUPABASE_INTEGRATION)expect(supabaseTestGateFailures()).toEqual([]);});
suite("atomic saved report snapshots",()=>{
 let admin:SupabaseClient,owner:SupabaseClient;let uid:string;
 const tables=['profiles','cases','inputs','evidence_units','reports','report_sections','audit_events'];
 function ok(r:{error:{message:string}|null}){expect(r.error,r.error?.message).toBeNull();}
 beforeAll(async()=>{
  admin=createClient(TEST_SUPABASE_URL!,TEST_SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const email=`save-${randomUUID()}@example.test`,password='synthetic-local-password-12345!';
  const created=await admin.auth.admin.createUser({email,password,email_confirm:true});uid=created.data.user?.id??'';ok(created);expect(uid).not.toBe('');
  owner=createClient(TEST_SUPABASE_URL!,TEST_SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});ok(await owner.auth.signInWithPassword({email,password}));
 });
 afterAll(async()=>{if(uid)ok(await admin.auth.admin.deleteUser(uid));});
 function payload(){
  const id=randomUUID();const e=new AuditLog().append({reportId:id,sectionKey:'opinions',prompt:'synthetic',model:'no-ai',modelVersion:'test',inputIds:['E1'],output:'synthetic'});
  return {p_meta:{matter:'Synthetic save',retainingCounsel:'Example',expertRole:'Expert'},p_profile:{full_name:'Profile A',credentials:'CRC',publications_last_10yr:[],prior_testimony_last_4yr:[],compensation_statement:'synthetic'},p_evidence:[{ref_id:'E1',content:'synthetic',location:'fixture',section_key:'opinions'}],p_report:{id,discipline:'vocrehab',template_version:'test',deliverable_style:null},p_sections:[{section_key:'opinions',draft_text:'synthetic',final_text:null,cited_evidence_ids:['E1'],ungrounded_flags:[]}],p_audit:[{seq:0,event_id:e.id,chain_report_id:id,section_key:e.sectionKey,prompt:e.prompt,model:e.model,model_version:e.modelVersion,input_ids:e.inputIds,output:e.output,created_at_iso:e.createdAt,prev_hash:e.prevHash,entry_hash:e.entryHash}]};
 }
 async function snapshot(){const all:Record<string,unknown>={};for(const table of tables){const r=await admin.from(table).select('*').order('id');ok(r);all[table]=r.data;}return all;}
 it("writes the complete graph with report-owned profile and exact audit fields",async()=>{
  const p=payload();const r=await owner.rpc('save_report_snapshot',p);ok(r);expect(r.data.reportId).toBe(p.p_report.id);
  const report=await owner.from('reports').select('*').eq('id',r.data.reportId).single();ok(report);expect(report.data.profile_snapshot).toEqual(p.p_profile);
  const c=await owner.from('cases').select('owner_id').eq('id',r.data.caseId).single();ok(c);expect(c.data!.owner_id).toBe(uid);
  const audit=await owner.from('audit_events').select('*').eq('report_id',r.data.reportId).order('seq');ok(audit);expect(audit.data).toHaveLength(1);expect(audit.data![0]).toMatchObject(p.p_audit[0]);expect(verifyAuditChain(auditRowsToEvents(audit.data!)).ok).toBe(true);
  const input=await owner.from('inputs').select('id,evidence_units(*)').eq('case_id',r.data.caseId);ok(input);expect(input.data).toHaveLength(1);expect(input.data![0]!.evidence_units).toHaveLength(1);
  const sections=await owner.from('report_sections').select('*').eq('report_id',r.data.reportId);ok(sections);expect(sections.data).toHaveLength(1);
 });
 it("keeps report A's profile after saving B with changed defaults",async()=>{
  const a=payload();const ra=await owner.rpc('save_report_snapshot',a);ok(ra);
  const b=payload();b.p_profile.full_name='Profile B';ok(await owner.rpc('save_report_snapshot',b));
  const old=await owner.from('reports').select('profile_snapshot').eq('id',ra.data.reportId).single();ok(old);expect(old.data!.profile_snapshot).toEqual(a.p_profile);
  const defaults=await owner.from('profiles').select('full_name').eq('id',uid).single();ok(defaults);expect(defaults.data!.full_name).toBe('Profile B');
 });
 it("rolls back even the profile change after a late section uniqueness failure",async()=>{
  const before=await snapshot();const p=payload();p.p_profile.full_name='MUST ROLL BACK';
  const invalid={...p,p_sections:[...p.p_sections,...p.p_sections]};const r=await owner.rpc('save_report_snapshot',invalid);expect(r.error?.code).toBe('23505');expect(await snapshot()).toEqual(before);
 });
 it.each(['identity','sequence'])("refuses invalid audit %s with no writes",async reason=>{
  const before=await snapshot();const p=payload();if(reason==='identity')p.p_audit[0]!.chain_report_id=randomUUID();else p.p_audit[0]!.seq=7;
  const r=await owner.rpc('save_report_snapshot',p);expect(r.error?.code).toBe('22023');expect(await snapshot()).toEqual(before);
 });
 it.each(['empty-sections','profile-array','section-array','audit-hash','style-type'])("rejects unloadable nested payload %s without any writes",async kind=>{
  const before=await snapshot();const p=payload();
  const invalid = kind==='empty-sections'?{...p,p_sections:[]}:kind==='profile-array'?{...p,p_profile:{...p.p_profile,publications_last_10yr:'invalid'}}:kind==='section-array'?{...p,p_sections:p.p_sections.map(s=>({...s,cited_evidence_ids:{}}))}:kind==='audit-hash'?{...p,p_audit:p.p_audit.map(a=>({...a,entry_hash:null}))}:{...p,p_report:{...p.p_report,deliverable_style:{fontSizePt:'12'}}};
  const r=await owner.rpc('save_report_snapshot',invalid);expect(r.error?.code).toBe('22023');expect(await snapshot()).toEqual(before);
 });
 it("binds a second caller to their own account and cannot overwrite the first owner's report",async()=>{
  const existing=await owner.rpc('save_report_snapshot',payload());ok(existing);
  const email=`save-other-${randomUUID()}@example.test`,password='synthetic-local-password-12345!';const created=await admin.auth.admin.createUser({email,password,email_confirm:true});ok(created);expect(created.data.user).not.toBeNull();const otherId=created.data.user!.id;
  try {
   const other=createClient(TEST_SUPABASE_URL!,TEST_SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});ok(await other.auth.signInWithPassword({email,password}));
   const hidden=await other.from('reports').select('id').eq('id',existing.data.reportId);ok(hidden);expect(hidden.data).toEqual([]);
   const before=await snapshot();const collision=payload();collision.p_report.id=existing.data.reportId;collision.p_audit[0]!.chain_report_id=existing.data.reportId;
   expect((await other.rpc('save_report_snapshot',collision)).error).not.toBeNull();expect(await snapshot()).toEqual(before);
   const own=payload();const r=await other.rpc('save_report_snapshot',{...own,p_meta:{...own.p_meta,owner_id:uid}});ok(r);
   const c=await admin.from('cases').select('owner_id').eq('id',r.data.caseId).single();ok(c);expect(c.data!.owner_id).toBe(otherId);
  } finally {ok(await admin.auth.admin.deleteUser(otherId));}
 });
 it("rejects malformed array input and anonymous execution without writes",async()=>{
  const before=await snapshot();const r=await owner.rpc('save_report_snapshot',{...payload(),p_evidence:null});expect(r.error?.code).toBe('22023');
  const anon=createClient(TEST_SUPABASE_URL!,TEST_SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});expect((await anon.rpc('save_report_snapshot',payload())).error?.code).toBe('42501');expect(await snapshot()).toEqual(before);
 });
});
