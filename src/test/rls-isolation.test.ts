import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireTestDbInCI } from "./require-test-db";

// Cross-user isolation: the single most important security test for a tool that
// holds litigation-sensitive case files under protective order. It proves user
// B can never read, modify, or delete user A's rows — the RLS contract in
// supabase/migrations/0001_init.sql, exercised against a REAL Postgres.
//
// Env-gated so it SKIPS in normal/CI runs (which have no database) and runs only
// against a throwaway/local Supabase when these are set:
//   TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_ROLE_KEY, TEST_SUPABASE_ANON_KEY
// A skipped security test is a liability; this is wired so it becomes REQUIRED
// (RELEASE.md) the moment real case data is accepted — just point it at a DB.

const URL = process.env.TEST_SUPABASE_URL;
const SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY;
// Skips locally without a database; throws in CI rather than passing vacuously.
const hasTestDB = requireTestDbInCI({
  TEST_SUPABASE_URL: URL,
  TEST_SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
  TEST_SUPABASE_ANON_KEY: ANON_KEY,
});

// RLS denials return ZERO ROWS, not an error. So "no access" passes if EITHER
// an error is raised OR the result set is empty. Treating only errors as a pass
// would let a silent leak through — the classic RLS test footgun.
function assertNoRead(error: unknown, data: unknown[] | null) {
  const denied = Boolean(error) || !data || data.length === 0;
  expect(denied, "expected RLS to deny cross-user read (error or empty set)").toBe(true);
}

const suite = hasTestDB ? describe : describe.skip;

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
    admin = createClient(URL!, SERVICE_KEY!, {
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
    userAId = a.data.user!.id;
    userBId = b.data.user!.id;

    // Seed A's case + report via the service role (RLS-bypass, like a trusted
    // server path would). Use admin so the seed itself isn't what we're testing.
    const caseRes = await admin
      .from("cases")
      .insert({ owner_id: userAId, matter: "A's confidential matter" })
      .select("id")
      .single();
    caseAId = caseRes.data!.id;

    const reportRes = await admin
      .from("reports")
      .insert({ case_id: caseAId, discipline: "vocational_rehab", template_version: "v1" })
      .select("id")
      .single();
    reportAId = reportRes.data!.id;

    // B's own anon-key client, signed in as B — this client is subject to RLS.
    clientB = createClient(URL!, ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await clientB.auth.signInWithPassword({ email: emailB, password });
  });

  afterAll(async () => {
    if (!admin) return;
    if (caseAId) await admin.from("cases").delete().eq("id", caseAId);
    if (userAId) await admin.auth.admin.deleteUser(userAId);
    if (userBId) await admin.auth.admin.deleteUser(userBId);
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
    const { data, error } = await clientB
      .from("audit_events")
      .select("*")
      .eq("report_id", reportAId);
    assertNoRead(error, data);
  });

  it("B cannot UPDATE A's case (no rows affected)", async () => {
    const { data } = await clientB
      .from("cases")
      .update({ matter: "hijacked" })
      .eq("id", caseAId)
      .select("id");
    expect(data ?? []).toHaveLength(0);
    // Confirm A's row is untouched, read back via the admin (RLS-bypass) client.
    const after = await admin.from("cases").select("matter").eq("id", caseAId).single();
    expect(after.data!.matter).toBe("A's confidential matter");
  });

  it("B cannot DELETE A's case (no rows affected)", async () => {
    const { data } = await clientB.from("cases").delete().eq("id", caseAId).select("id");
    expect(data ?? []).toHaveLength(0);
    const still = await admin.from("cases").select("id").eq("id", caseAId);
    expect(still.data ?? []).toHaveLength(1);
  });

  it("audit_events is append-only: even its owner cannot UPDATE or DELETE", async () => {
    // Seed an audit row for B's own report so RLS read/insert would allow it,
    // then prove the missing UPDATE/DELETE policies deny mutation for everyone.
    const bCase = await admin
      .from("cases")
      .insert({ owner_id: userBId, matter: "B matter" })
      .select("id")
      .single();
    const bReport = await admin
      .from("reports")
      .insert({ case_id: bCase.data!.id, discipline: "vocational_rehab", template_version: "v1" })
      .select("id")
      .single();
    const bAudit = await admin
      .from("audit_events")
      .insert({
        report_id: bReport.data!.id,
        section_key: "opinions",
        prompt: "p",
        model: "m",
        model_version: "mv",
        output: "o",
      })
      .select("id")
      .single();

    const upd = await clientB
      .from("audit_events")
      .update({ output: "tampered" })
      .eq("id", bAudit.data!.id)
      .select("id");
    expect(upd.data ?? []).toHaveLength(0);

    const del = await clientB
      .from("audit_events")
      .delete()
      .eq("id", bAudit.data!.id)
      .select("id");
    expect(del.data ?? []).toHaveLength(0);

    await admin.from("cases").delete().eq("id", bCase.data!.id);
  });
});
