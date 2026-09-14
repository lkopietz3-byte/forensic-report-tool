import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  REQUIRE_SUPABASE_INTEGRATION,
  SUPABASE_TEST_TARGET_SAFE,
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_SERVICE_ROLE_KEY,
  TEST_SUPABASE_URL,
  supabaseTestGateFailures,
} from "./supabaseTestTarget";

// Credit-ledger integrity against a disposable, migrated Supabase database.
// Normal unit-test runs may skip the database suite, but `npm run test:db`
// makes missing credentials, a non-loopback target, or the wrong migration
// acknowledgement a hard failure. Never point this test at production or real accounts.

const dbSuite = SUPABASE_TEST_TARGET_SAFE ? describe : describe.skip;

function assertNoError(result: { error: { message: string } | null }, context: string): void {
  expect(result.error, `${context}: ${result.error?.message ?? "unknown database error"}`).toBeNull();
}

async function balance(admin: SupabaseClient, userId: string): Promise<number> {
  const result = await admin.from("credit_ledger").select("delta").eq("user_id", userId);
  assertNoError(result, "read credit balance");
  return (result.data ?? []).reduce((sum, row) => sum + (row.delta as number), 0);
}

describe("Supabase financial integration gate configuration", () => {
  it("repository migrations include the status RPC and current public-capture lock", () => {
    const migrationsDir = fileURLToPath(new URL("../../supabase/migrations/", import.meta.url));
    const migrations = readdirSync(migrationsDir).filter((name) => name.endsWith(".sql")).sort();

    expect(migrations).toContain("0013_spend_credit_status.sql");
    expect(migrations).toContain("0014_lock_public_capture_tables.sql");
    expect(migrations.at(-1)).toBe("0016_save_report_snapshot.sql");
  });

  it("fails closed when the release gate requires a loopback 0015 database", () => {
    if (!REQUIRE_SUPABASE_INTEGRATION) return;
    expect(supabaseTestGateFailures()).toEqual([]);
  });
});

dbSuite("credit ledger integrity on migrated throwaway database", () => {
  let admin: SupabaseClient;
  let signedInUser: SupabaseClient;
  let userId = "";
  let testNumber = 0;
  const password = "synthetic-test-password-12345!";

  beforeEach(async () => {
    testNumber += 1;
    admin = createClient(TEST_SUPABASE_URL!, TEST_SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const email = `credits-${Date.now()}-${testNumber}@example.test`;
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    assertNoError(created, "create synthetic credit-test user");
    expect(created.data.user).not.toBeNull();
    userId = created.data.user!.id;

    signedInUser = createClient(TEST_SUPABASE_URL!, TEST_SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const signedIn = await signedInUser.auth.signInWithPassword({ email, password });
    assertNoError(signedIn, "sign in synthetic browser user");
  });

  afterEach(async () => {
    await signedInUser?.auth.signOut();
    if (userId) {
      const deleted = await admin.auth.admin.deleteUser(userId);
      assertNoError(deleted, "delete synthetic credit-test user");
    }
    userId = "";
  });

  it("returns debited then insufficient and never creates a negative balance", async () => {
    const grant = await admin.from("credit_ledger").insert({
      user_id: userId,
      delta: 1,
      reason: "signup_grant",
    });
    assertNoError(grant, "grant one synthetic credit");

    const first = await admin.rpc("spend_credit", {
      p_user: userId,
      p_fingerprint: "synthetic-first-report",
    });
    assertNoError(first, "first spend");
    expect(first.data).toBe("debited");

    const second = await admin.rpc("spend_credit", {
      p_user: userId,
      p_fingerprint: "synthetic-second-report",
    });
    assertNoError(second, "second spend");
    expect(second.data).toBe("insufficient");
    expect(await balance(admin, userId)).toBe(0);
  });

  it("returns one debit for two concurrently dispatched different fingerprints", async () => {
    const grant = await admin.from("credit_ledger").insert({
      user_id: userId,
      delta: 1,
      reason: "purchase",
      stripe_session_id: `cs_concurrency_${Date.now()}_${testNumber}`,
    });
    assertNoError(grant, "grant concurrency-test credit");

    const [first, second] = await Promise.all([
      admin.rpc("spend_credit", { p_user: userId, p_fingerprint: "synthetic-concurrent-a" }),
      admin.rpc("spend_credit", { p_user: userId, p_fingerprint: "synthetic-concurrent-b" }),
    ]);
    assertNoError(first, "concurrent spend A");
    assertNoError(second, "concurrent spend B");
    expect([first.data, second.data].sort()).toEqual(["debited", "insufficient"]);
    expect(await balance(admin, userId)).toBe(0);
  });

  // Promise.all verifies the observed API outcome; independent SQL lock-wait
  // evidence is required before claiming database execution actually overlapped.
  it("settles simultaneous same-fingerprint requests with one export debit", async () => {
    const fingerprint = `synthetic-collision-${Date.now()}-${testNumber}`;
    assertNoError(await admin.from("credit_ledger").insert({
      user_id: userId, delta: 1, reason: "signup_grant",
    }), "grant collision-test credit");
    const results = await Promise.all([
      admin.rpc("spend_credit", { p_user: userId, p_fingerprint: fingerprint }),
      admin.rpc("spend_credit", { p_user: userId, p_fingerprint: fingerprint }),
    ]);
    for (const result of results) assertNoError(result, "same-fingerprint collision");
    expect(results.map((result) => result.data).sort()).toEqual(["already_paid", "debited"]);
    expect(await balance(admin, userId)).toBe(0);
    const debits = await admin.from("credit_ledger").select("delta")
      .eq("user_id", userId).eq("reason", "export").eq("export_fingerprint", fingerprint);
    assertNoError(debits, "read collision export debits");
    expect(debits.data).toEqual([{ delta: -1 }]);
  });

  it("keeps same-fingerprint idempotency and cancels a legacy debit adjustment on retry", async () => {
    const successfulFingerprint = `synthetic-success-${Date.now()}-${testNumber}`;
    const failedFingerprint = `synthetic-failure-${Date.now()}-${testNumber}`;
    const grant = await admin.from("credit_ledger").insert({
      user_id: userId,
      delta: 2,
      reason: "purchase",
      stripe_session_id: `cs_fingerprint_${Date.now()}_${testNumber}`,
    });
    assertNoError(grant, "grant fingerprint-test credit");

    const first = await admin.rpc("spend_credit", { p_user: userId, p_fingerprint: successfulFingerprint });
    assertNoError(first, "first fingerprint spend");
    expect(first.data).toBe("debited");
    expect(await balance(admin, userId)).toBe(1);

    const repeat = await admin.rpc("spend_credit", { p_user: userId, p_fingerprint: successfulFingerprint });
    assertNoError(repeat, "same-fingerprint repeat");
    expect(repeat.data).toBe("already_paid");
    expect(await balance(admin, userId)).toBe(1);

    const failedRenderSpend = await admin.rpc("spend_credit", {
      p_user: userId,
      p_fingerprint: failedFingerprint,
    });
    assertNoError(failedRenderSpend, "failed-render debit");
    expect(failedRenderSpend.data).toBe("debited");
    expect(await balance(admin, userId)).toBe(0);

    // Migration 0013 must still interpret adjustment rows created by older app
    // revisions. The current route renders before spending and creates no new
    // render-failure adjustments.
    const legacyAdjustment = await admin.from("credit_ledger").insert({
      user_id: userId,
      delta: 1,
      reason: "adjustment",
      export_fingerprint: failedFingerprint,
    });
    assertNoError(legacyAdjustment, "synthetic legacy debit adjustment");
    expect(await balance(admin, userId)).toBe(1);

    const retry = await admin.rpc("spend_credit", { p_user: userId, p_fingerprint: failedFingerprint });
    assertNoError(retry, "post-adjustment retry");
    expect(retry.data).toBe("debited");
    expect(await balance(admin, userId)).toBe(0);
  });

  it("rejects a duplicate Stripe session without granting twice", async () => {
    const sessionId = `cs_duplicate_${Date.now()}_${testNumber}`;
    const first = await admin.from("credit_ledger").insert({
      user_id: userId,
      delta: 5,
      reason: "purchase",
      stripe_session_id: sessionId,
    });
    assertNoError(first, "first synthetic purchase grant");

    const replay = await admin.from("credit_ledger").insert({
      user_id: userId,
      delta: 5,
      reason: "purchase",
      stripe_session_id: sessionId,
    });
    expect(replay.error?.code).toBe("23505");
    expect(await balance(admin, userId)).toBe(5);
  });

  it("does not let an authenticated browser role execute the service-only spend RPC", async () => {
    const attempt = await signedInUser.rpc("spend_credit", {
      p_user: userId,
      p_fingerprint: "synthetic-browser-attempt",
    });
    expect(attempt.error).not.toBeNull();
    expect(attempt.data).toBeNull();
    expect(await balance(admin, userId)).toBe(0);
  });

  it("does not let an authenticated browser role write directly to the credit ledger", async () => {
    const attempt = await signedInUser.from("credit_ledger").insert({
      user_id: userId,
      delta: 99,
      reason: "adjustment",
    });
    expect(attempt.error).not.toBeNull();
    expect(await balance(admin, userId)).toBe(0);
  });

  it("keeps direct anonymous and authenticated intake writes locked after migration 0014", async () => {
    const anonymous = createClient(TEST_SUPABASE_URL!, TEST_SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const token = `${Date.now()}-${testNumber}`;
    const waitlistEmail = `locked-${token}@example.test`;
    const authenticatedEmail = `locked-auth-${token}@example.test`;
    const anonymousSource = `synthetic-direct-anon-test-${token}`;
    const authenticatedSource = `synthetic-direct-authenticated-test-${token}`;

    const anonymousWaitlist = await anonymous.from("waitlist").insert({
      email: waitlistEmail,
      source: anonymousSource,
    });
    const anonymousFeedback = await anonymous.from("feedback").insert({
      message: "Synthetic direct anonymous insert should be denied.",
      source: anonymousSource,
    });

    const authenticatedWaitlist = await signedInUser.from("waitlist").insert({
      email: authenticatedEmail,
      source: authenticatedSource,
    });
    const authenticatedFeedback = await signedInUser.from("feedback").insert({
      message: "Synthetic direct authenticated insert should be denied.",
      source: authenticatedSource,
    });

    // Clean any unexpected writes before asserting, so a failing test never
    // leaves misleading synthetic intake rows behind in the disposable DB.
    const waitlistCleanup = await admin
      .from("waitlist")
      .delete()
      .in("email", [waitlistEmail, authenticatedEmail]);
    assertNoError(waitlistCleanup, "clean unexpected direct waitlist rows");
    const feedbackCleanup = await admin
      .from("feedback")
      .delete()
      .in("source", [anonymousSource, authenticatedSource]);
    assertNoError(feedbackCleanup, "clean unexpected direct feedback rows");

    expect(anonymousWaitlist.error).not.toBeNull();
    expect(anonymousFeedback.error).not.toBeNull();
    expect(authenticatedWaitlist.error).not.toBeNull();
    expect(authenticatedFeedback.error).not.toBeNull();

    const trustedControl = await admin.from("waitlist").insert({
      email: waitlistEmail,
      source: "synthetic-service-control",
    });
    assertNoError(trustedControl, "service-role waitlist control insert");
    const cleanup = await admin.from("waitlist").delete().eq("email", waitlistEmail);
    assertNoError(cleanup, "clean service-role waitlist control row");
  });

  it("rejects a replayed Stripe event id", async () => {
    const eventId = `evt_synthetic_${Date.now()}_${testNumber}`;
    try {
      const first = await admin.from("stripe_events").insert({
        id: eventId,
        type: "checkout.session.completed",
      });
      assertNoError(first, "first synthetic Stripe event");
      const replay = await admin.from("stripe_events").insert({
        id: eventId,
        type: "checkout.session.completed",
      });
      expect(replay.error?.code).toBe("23505");
    } finally {
      const cleanup = await admin.from("stripe_events").delete().eq("id", eventId);
      assertNoError(cleanup, "clean synthetic Stripe event");
    }
  });
});
