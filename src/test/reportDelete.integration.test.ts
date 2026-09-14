import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AuditLog } from "@/lib/domain/audit";
import { SUPABASE_TEST_TARGET_SAFE, TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_SERVICE_ROLE_KEY, REQUIRE_SUPABASE_INTEGRATION, supabaseTestGateFailures } from "./supabaseTestTarget";
const suite = SUPABASE_TEST_TARGET_SAFE ? describe : describe.skip;
it("requires a configured local current-schema target when the deletion DB gate is requested", () => {
  if (REQUIRE_SUPABASE_INTEGRATION) expect(supabaseTestGateFailures()).toEqual([]);
});
suite("atomic owner-scoped saved-report deletion", () => {
  let admin: SupabaseClient, owner: SupabaseClient, other: SupabaseClient;
  const users: string[] = [];
  function ok(result: {error: {message:string}|null}) { expect(result.error, result.error?.message).toBeNull(); }
  beforeAll(async () => {
    admin = createClient(TEST_SUPABASE_URL!, TEST_SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession:false, autoRefreshToken:false } });
    const clients: SupabaseClient[] = [];
    for (const suffix of ["a", "b"]) {
      const email = `delete-${Date.now()}-${suffix}@example.test`, password = "synthetic-local-password-12345!";
      const created = await admin.auth.admin.createUser({ email, password, email_confirm:true });
      if (created.data.user) users.push(created.data.user.id);
      ok(created); expect(created.data.user).not.toBeNull();
      const client = createClient(TEST_SUPABASE_URL!, TEST_SUPABASE_ANON_KEY!, { auth: { persistSession:false, autoRefreshToken:false } });
      ok(await client.auth.signInWithPassword({ email, password })); clients.push(client);
    }
    [owner, other] = clients;
  });
  afterAll(async () => {
    const results = await Promise.all(users.map(id => admin.auth.admin.deleteUser(id)));
    for (const result of results) ok(result);
  });
  async function seed(ownerId = users[0]) {
    const c = await admin.from("cases").insert({ owner_id:ownerId, matter:"synthetic deletion fixture" }).select("id").single(); ok(c);
    const caseId = c.data!.id;
    const input = await admin.from("inputs").insert({case_id:caseId,type:"note",extracted_text:"synthetic"}).select("id").single(); ok(input);
    const evidence = await admin.from("evidence_units").insert({input_id:input.data!.id,content:"synthetic evidence",location:"fixture"}).select("id").single(); ok(evidence);
    const report = await admin.from("reports").insert({case_id:caseId,discipline:"vocrehab",template_version:"test"}).select("id").single(); ok(report);
    const id = report.data!.id;
    const section = await admin.from("report_sections").insert({report_id:id,section_key:"opinions",draft_text:"synthetic"}).select("id").single(); ok(section);
    const event = new AuditLog().append({reportId:id,sectionKey:"opinions",prompt:"synthetic",model:"no-ai",modelVersion:"test",inputIds:[],output:"synthetic"});
    const audit = await admin.from("audit_events").insert({report_id:id,section_key:event.sectionKey,prompt:event.prompt,model:event.model,model_version:event.modelVersion,input_ids:event.inputIds,output:event.output,seq:0,event_id:event.id,chain_report_id:id,created_at_iso:event.createdAt,prev_hash:event.prevHash,entry_hash:event.entryHash}).select("id").single(); ok(audit);
    return {id,caseId,rows:{cases:caseId,inputs:input.data!.id,evidence_units:evidence.data!.id,reports:id,report_sections:section.data!.id,audit_events:audit.data!.id}};
  }
  async function snapshot(rows: Record<string,string>) {
    const data: Record<string,unknown> = {};
    for (const [table,id] of Object.entries(rows)) { const r=await admin.from(table).select("*").eq("id",id); ok(r); data[table]=r.data; }
    return data;
  }
  it("removes the owned snapshot and audit together while preserving unrelated data", async () => {
    const target=await seed(), unrelated=await seed(users[1]);
    const before=await snapshot(unrelated.rows); const present=await snapshot(target.rows);
    for (const rows of Object.values(present)) expect(rows).toHaveLength(1);
    const result=await owner.rpc("delete_saved_report",{p_report_id:target.id}); ok(result); expect(result.data).toBe("deleted");
    for (const rows of Object.values(await snapshot(target.rows))) expect(rows).toEqual([]);
    expect(await snapshot(unrelated.rows)).toEqual(before);
  });
  it("does not reveal or mutate another owner's report", async () => {
    const target=await seed(); const before=await snapshot(target.rows);
    const result=await other.rpc("delete_saved_report",{p_report_id:target.id}); ok(result); expect(result.data).toBe("not_found");
    expect(await snapshot(target.rows)).toEqual(before);
  });
  it("refuses a shared case and preserves both reports and every original row", async () => {
    const target=await seed();
    const sibling=await admin.from("reports").insert({case_id:target.caseId,discipline:"vocrehab",template_version:"test"}).select("id").single(); ok(sibling);
    const before=await snapshot(target.rows);
    const result=await owner.rpc("delete_saved_report",{p_report_id:target.id}); ok(result); expect(result.data).toBe("shared_case");
    expect(await snapshot(target.rows)).toEqual(before);
    const siblingAfter=await admin.from("reports").select("id").eq("id",sibling.data!.id); ok(siblingAfter); expect(siblingAfter.data).toEqual([{id:sibling.data!.id}]);
  });
  it("returns not_found on a repeated deletion, never a second deleted acknowledgement", async () => {
    const target=await seed(); const first=await owner.rpc("delete_saved_report",{p_report_id:target.id}); ok(first); expect(first.data).toBe("deleted");
    const second=await owner.rpc("delete_saved_report",{p_report_id:target.id}); ok(second); expect(second.data).toBe("not_found");
  });
  it("denies anonymous RPC execution without deleting anything", async () => {
    const target=await seed(); const before=await snapshot(target.rows);
    const anon=createClient(TEST_SUPABASE_URL!,TEST_SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
    const result=await anon.rpc("delete_saved_report",{p_report_id:target.id}); expect(result.error?.code).toBe("42501");
    expect(await snapshot(target.rows)).toEqual(before);
  });
});
