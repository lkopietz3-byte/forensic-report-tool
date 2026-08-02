import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Credit-ledger integrity against a REAL Postgres: proves the atomic spend RPC
// (migration 0007) prevents the double-spend race, never goes negative, and that
// purchase grants are idempotent on the Stripe session id (migration 0005).
//
// Env-gated like rls-isolation.test.ts — SKIPS without a database, RUNS when
// TEST_SUPABASE_URL / TEST_SUPABASE_SERVICE_ROLE_KEY are set against a throwaway
// Supabase that has migrations 0001–0007 applied.

const URL = process.env.TEST_SUPABASE_URL;
const SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const hasTestDB = Boolean(URL && SERVICE_KEY);
const suite = hasTestDB ? describe : describe.skip;

async function balance(admin: SupabaseClient, userId: string): Promise<number> {
  const { data } = await admin.from("credit_ledger").select("delta").eq("user_id", userId);
  return (data ?? []).reduce((s, r) => s + (r.delta as number), 0);
}

suite("credit ledger integrity (atomic spend + idempotent grants)", () => {
  let admin: SupabaseClient;
  let userId = "";
  const email = `credits-${Date.now()}@example.test`;

  beforeAll(async () => {
    admin = createClient(URL!, SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const u = await admin.auth.admin.createUser({ email, password: "test-password-12345!", email_confirm: true });
    userId = u.data.user!.id;
  });

  afterAll(async () => {
    if (userId) await admin.auth.admin.deleteUser(userId); // cascades credit_ledger
  });

  it("spends a credit and refuses once the balance hits zero (never negative)", async () => {
    await admin.from("credit_ledger").insert({ user_id: userId, delta: 1, reason: "signup_grant" });
    expect(await balance(admin, userId)).toBe(1);

    const first = await admin.rpc("spend_credit", { p_user: userId });
    expect(first.data).toBe(true);
    expect(await balance(admin, userId)).toBe(0);

    const second = await admin.rpc("spend_credit", { p_user: userId });
    expect(second.data).toBe(false); // out of credits
    expect(await balance(admin, userId)).toBe(0); // never -1
  });

  it("two concurrent spends on a single credit yield exactly one success (no double-spend)", async () => {
    await admin.from("credit_ledger").insert({ user_id: userId, delta: 1, reason: "purchase", stripe_session_id: `cs_${Date.now()}` });
    expect(await balance(admin, userId)).toBe(1);

    const [a, b] = await Promise.all([
      admin.rpc("spend_credit", { p_user: userId }),
      admin.rpc("spend_credit", { p_user: userId }),
    ]);
    const successes = [a.data, b.data].filter((x) => x === true).length;
    expect(successes).toBe(1); // the advisory lock serializes them
    expect(await balance(admin, userId)).toBe(0); // never -1
  });

  it("a purchase grant is idempotent on the Stripe session id (webhook replay is a no-op)", async () => {
    const session = `cs_dup_${Date.now()}`;
    const r1 = await admin.from("credit_ledger").insert({ user_id: userId, delta: 5, reason: "purchase", stripe_session_id: session });
    expect(r1.error).toBeNull();
    const r2 = await admin.from("credit_ledger").insert({ user_id: userId, delta: 5, reason: "purchase", stripe_session_id: session });
    expect(r2.error?.code).toBe("23505"); // uniq_credit_session rejects the replay
  });

  it("a credit covers a REPORT: same fingerprint spends once, Word+PDF don't double-charge (0009)", async () => {
    await admin.from("credit_ledger").insert({ user_id: userId, delta: 1, reason: "purchase", stripe_session_id: `cs_fp_${Date.now()}` });
    const before = await balance(admin, userId);
    const fp = `fp_${Date.now()}`;

    const first = await admin.rpc("spend_credit", { p_user: userId, p_fingerprint: fp });
    expect(first.data).toBe(true);
    expect(await balance(admin, userId)).toBe(before - 1);

    // Second export of the SAME report content (e.g. PDF after Word): free.
    const second = await admin.rpc("spend_credit", { p_user: userId, p_fingerprint: fp });
    expect(second.data).toBe(true);
    expect(await balance(admin, userId)).toBe(before - 1); // unchanged

    // A refund carrying the fingerprint cancels the "already paid" claim.
    await admin.from("credit_ledger").insert({ user_id: userId, delta: 1, reason: "adjustment", export_fingerprint: fp });
    const third = await admin.rpc("spend_credit", { p_user: userId, p_fingerprint: fp });
    expect(third.data).toBe(true); // re-debits normally
    expect(await balance(admin, userId)).toBe(before - 1); // refund +1 then debit -1
  });

  it("the webhook idempotency ledger rejects a duplicate event id (0006)", async () => {
    const evtId = `evt_${Date.now()}`;
    const r1 = await admin.from("stripe_events").insert({ id: evtId, type: "checkout.session.completed" });
    expect(r1.error).toBeNull();
    const r2 = await admin.from("stripe_events").insert({ id: evtId, type: "checkout.session.completed" });
    expect(r2.error?.code).toBe("23505"); // primary-key conflict => already processed
    await admin.from("stripe_events").delete().eq("id", evtId);
  });
});
