import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AuditLog, verifyAuditChain } from "@/lib/domain/audit";
import { auditRowsToEvents, type AuditRow } from "@/lib/report/persistence";
import {
  SUPABASE_TEST_TARGET_SAFE,
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_SERVICE_ROLE_KEY,
  TEST_SUPABASE_URL,
} from "./supabaseTestTarget";

// Selected cross-user case/report/audit protections against a real Postgres.
// Positive controls ensure denials exercise functioning access paths. This is
// not coverage of every table/policy in 0001 or audit retention after parent deletion.
//
// Env-gated so it SKIPS in normal/CI runs (which have no database) and runs only
// when the shared safety gate confirms a loopback Supabase target migrated
// through 0015. `npm run test:db` makes a skip a hard
// failure before real case data or billing can be released.

// A denial is meaningful only when requests work and the target row exists.
// Missing grants and dependency errors must fail rather than look like RLS success.
function assertNoRead(error: unknown, data: unknown[] | null) {
  expect(error).toBeNull();
  expect(data).toEqual([]);
}

function assertNoError(result: { error: { message: string } | null }): void {
  expect(result.error, result.error?.message).toBeNull();
}

function auditFixture(reportId: string): AuditRow {
  const event = new AuditLog().append({
    reportId, sectionKey: "opinions", prompt: "synthetic supplied material",
    model: "synthetic-test-model", modelVersion: "test", inputIds: [], output: "synthetic output",
  });
  expect(verifyAuditChain([event]).ok).toBe(true);
  return {
    seq: 0, event_id: event.id, chain_report_id: event.reportId,
    section_key: event.sectionKey, prompt: event.prompt, model: event.model,
    model_version: event.modelVersion, input_ids: [...event.inputIds], output: event.output,
    created_at_iso: event.createdAt, prev_hash: event.prevHash, entry_hash: event.entryHash,
  };
}

const suite = SUPABASE_TEST_TARGET_SAFE ? describe : describe.skip;

suite("cross-user RLS isolation", () => {
  let admin: SupabaseClient;
  let clientB: SupabaseClient;
  let userAId = "";
  let userBId = "";
  let caseAId = "";
  let reportAId = "";
  const emailA = `iso-a-${Date.now()}@example.test`;
  const emailB = `iso-b-${Date.now()}@example.test`;
  const password = "test-password-12345!";

  beforeAll(async () => {
    admin = createClient(TEST_SUPABASE_URL!, TEST_SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const a = await admin.auth.admin.createUser({
      email: emailA,
      password,
      email_confirm: true,
    });
    const b = await admin.auth.admin.createUser({
      email: emailB,
      password,
      email_confirm: true,
    });
    // Retain any created identity before assertions so afterAll can clean partial setup.
    userAId = a.data.user?.id ?? "";
    userBId = b.data.user?.id ?? "";
    assertNoError(a);
    assertNoError(b);
    expect(userAId).not.toBe("");
    expect(userBId).not.toBe("");

    // Seed A's case + report via the service role (RLS-bypass, like a trusted
    // server path would). Use admin so the seed itself isn't what we're testing.
    const caseRes = await admin
      .from("cases")
      .insert({ owner_id: userAId, matter: "A's confidential matter" })
      .select("id")
      .single();
    assertNoError(caseRes);
    caseAId = caseRes.data!.id;

    const reportRes = await admin
      .from("reports")
      .insert({ case_id: caseAId, discipline: "vocational_rehab", template_version: "v1" })
      .select("id")
      .single();
    assertNoError(reportRes);
    reportAId = reportRes.data!.id;
    const audit = await admin.from("audit_events")
      .insert({ report_id: reportAId, ...auditFixture(reportAId) }).select("id").single();
    assertNoError(audit);
    expect(audit.data?.id).toBeTruthy();

    // B's own anon-key client, signed in as B — this client is subject to RLS.
    clientB = createClient(TEST_SUPABASE_URL!, TEST_SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const signedIn = await clientB.auth.signInWithPassword({ email: emailB, password });
    expect(signedIn.error, signedIn.error?.message).toBeNull();
    expect(signedIn.data.user?.id).toBe(userBId);
  });

  afterAll(async () => {
    if (!admin) return;
    // Attempt every cleanup even if one fails. Parent cascades are cleanup behavior,
    // not evidence of audit retention against owner-initiated parent deletion.
    const results = await Promise.all([userAId, userBId].filter(Boolean)
      .map((id) => admin.auth.admin.deleteUser(id)));
    for (const result of results) assertNoError(result);
  });

  it("B can create, read, update and delete its own case as an RLS positive control", async () => {
    const created = await clientB.from("cases").insert({ owner_id: userBId, matter: "B control" })
      .select("id").single();
    assertNoError(created);
    const id = created.data!.id;
    const read = await clientB.from("cases").select("id").eq("id", id);
    assertNoError(read);
    expect(read.data).toEqual([{ id }]);
    const updated = await clientB.from("cases").update({ matter: "B updated" }).eq("id", id)
      .select("matter");
    assertNoError(updated);
    expect(updated.data).toEqual([{ matter: "B updated" }]);
    const deleted = await clientB.from("cases").delete().eq("id", id).select("id");
    assertNoError(deleted);
    expect(deleted.data).toEqual([{ id }]);
  });

  it("B cannot SELECT A's case", async () => {
    const { data, error } = await clientB.from("cases").select("*").eq("id", caseAId);
    assertNoRead(error, data);
  });

  it("B cannot SELECT A's report", async () => {
    const { data, error } = await clientB.from("reports").select("*").eq("id", reportAId);
    assertNoRead(error, data);
  });

  it("B cannot SELECT A's audit_events", async () => {
    const control = await admin.from("audit_events").select("id").eq("report_id", reportAId);
    expect(control.error).toBeNull();
    expect(control.data, "A audit fixture must exist before a denial proves isolation").toHaveLength(1);
    const { data, error } = await clientB
      .from("audit_events")
      .select("*")
      .eq("report_id", reportAId);
    assertNoRead(error, data);
  });

  it("B cannot append an audit event to A's report", async () => {
    const before = await admin.from("audit_events").select("*").eq("report_id", reportAId);
    assertNoError(before);
    expect(before.data).toHaveLength(1);
    const attempt = await clientB.from("audit_events")
      .insert({ report_id: reportAId, ...auditFixture(reportAId) });
    expect(attempt.error?.code).toBe("42501");
    const after = await admin.from("audit_events").select("*").eq("report_id", reportAId);
    assertNoError(after);
    expect(after.data).toEqual(before.data);
    expect(verifyAuditChain(auditRowsToEvents(after.data!)).ok).toBe(true);
  });

  it("B cannot UPDATE A's case (no rows affected)", async () => {
    const { data, error } = await clientB
      .from("cases")
      .update({ matter: "hijacked" })
      .eq("id", caseAId)
      .select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
    // Confirm A's row is untouched, read back via the admin (RLS-bypass) client.
    const after = await admin.from("cases").select("matter").eq("id", caseAId).single();
    expect(after.data!.matter).toBe("A's confidential matter");
  });

  it("B cannot DELETE A's case (no rows affected)", async () => {
    const { data, error } = await clientB.from("cases").delete().eq("id", caseAId).select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
    const still = await admin.from("cases").select("id").eq("id", caseAId);
    expect(still.data ?? []).toHaveLength(1);
  });

  it("audit_events denies direct owner UPDATE and DELETE without changing the stored chain", async () => {
    // Seed an audit row for B's own report so RLS read/insert would allow it,
    // then prove the missing UPDATE/DELETE policies deny mutation for everyone.
    const bCase = await clientB
      .from("cases")
      .insert({ owner_id: userBId, matter: "B matter" })
      .select("id")
      .single();
    assertNoError(bCase);
    const bReport = await clientB
      .from("reports")
      .insert({ case_id: bCase.data!.id, discipline: "vocational_rehab", template_version: "v1" })
      .select("id")
      .single();
    assertNoError(bReport);
    const originalAudit = auditFixture(bReport.data!.id);
    const bAudit = await clientB
      .from("audit_events")
      .insert({
        report_id: bReport.data!.id,
        ...originalAudit,
      })
      .select("id")
      .single();

    assertNoError(bAudit);
    const ownRead = await clientB.from("audit_events").select("*").eq("id", bAudit.data!.id);
    assertNoError(ownRead);
    expect(ownRead.data).toHaveLength(1);
    expect(verifyAuditChain(auditRowsToEvents(ownRead.data!)).ok).toBe(true);

    const upd = await clientB
      .from("audit_events")
      .update({ output: "tampered" })
      .eq("id", bAudit.data!.id)
      .select("id");
    assertNoError(upd);
    expect(upd.data).toEqual([]);

    const del = await clientB
      .from("audit_events")
      .delete()
      .eq("id", bAudit.data!.id)
      .select("id");
    assertNoError(del);
    expect(del.data).toEqual([]);

    const after = await admin.from("audit_events").select("*").eq("id", bAudit.data!.id);
    assertNoError(after);
    expect(after.data).toEqual(ownRead.data);
    expect(verifyAuditChain(auditRowsToEvents(after.data!)).ok).toBe(true);
  });
});
