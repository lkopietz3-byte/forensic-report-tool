import "server-only";
import { createServiceClient } from "../supabase/server";
import { supabaseServiceConfigured } from "../supabase/config";
import { balanceFromRows } from "./creditLedger";
import { log } from "../log/logger";

// Server-side credit operations. All writes use the service client (RLS bypass)
// because grants/debits are trusted server actions, never user-initiated inserts
// — the ledger has no user insert policy, so this is the only write path.

/**
 * Current balance for a user, granting the one free "first report" credit on
 * first read. The grant is idempotent: the uniq_signup_grant partial index
 * guarantees at most one per user, so a duplicate insert (code 23505) is
 * swallowed. Returns null when persistence isn't configured (preview).
 */
export async function getCreditBalance(userId: string): Promise<number | null> {
  if (!supabaseServiceConfigured()) return null;
  const svc = createServiceClient();

  const { error: grantErr } = await svc
    .from("credit_ledger")
    .insert({ user_id: userId, delta: 1, reason: "signup_grant" });
  // 23505 = unique violation => already granted. Anything else is a real error.
  if (grantErr && grantErr.code !== "23505") {
    log.error("credits.signup_grant_failed", { err: grantErr.message });
  }

  const { data, error } = await svc
    .from("credit_ledger")
    .select("delta")
    .eq("user_id", userId);
  if (error) {
    log.error("credits.balance_read_failed", { err: error.message });
    return null;
  }
  return balanceFromRows((data ?? []) as { delta: number }[]);
}

/** Grant purchased credits, idempotent on the Stripe session id. */
export async function grantCredits(
  userId: string,
  credits: number,
  stripeSessionId: string,
): Promise<void> {
  const svc = createServiceClient();
  const { error } = await svc.from("credit_ledger").insert({
    user_id: userId,
    delta: credits,
    reason: "purchase",
    stripe_session_id: stripeSessionId,
  });
  // 23505 = this session already granted (webhook replay) => no-op.
  if (error && error.code !== "23505") throw new Error(error.message);
}

/**
 * Outcome of a credit spend. `debited` = a credit was actually taken this call;
 * `already_paid` = this exact report content was paid for on a prior call (an
 * idempotent Word-then-PDF re-export), so nothing was debited; `insufficient` =
 * out of credits; `unavailable` = the ledger couldn't be reached. Only a
 * `debited` result may be refunded on a later render failure.
 */
export type SpendResult = "debited" | "already_paid" | "insufficient" | "unavailable";

/**
 * Atomically spend one credit (check balance > 0 and debit in a single,
 * per-user-serialized DB operation — see migrations 0007/0009/0010). A credit
 * covers a REPORT, not a download: pass the report-content fingerprint and a
 * repeat spend for the same content succeeds as `already_paid` without debiting.
 */
export async function spendCredit(userId: string, fingerprint?: string): Promise<SpendResult> {
  if (!supabaseServiceConfigured()) return "unavailable";
  const svc = createServiceClient();
  const { data, error } = await svc.rpc("spend_credit", {
    p_user: userId,
    p_fingerprint: fingerprint ?? null,
  });
  if (error) {
    log.error("credits.spend_failed", { err: error.message });
    return "unavailable";
  }
  return data === "debited" || data === "already_paid" || data === "insufficient"
    ? data
    : "unavailable";
}

/**
 * Return a spent credit (when the export render fails after reserving). Carries
 * the fingerprint so the refund cancels that spend's "already paid" claim — a
 * later retry of the same report content debits normally instead of riding a
 * refunded fingerprint for free.
 */
export async function refundCredit(userId: string, fingerprint?: string): Promise<void> {
  if (!supabaseServiceConfigured()) return;
  const svc = createServiceClient();
  const { error } = await svc.from("credit_ledger").insert({
    user_id: userId,
    delta: 1,
    reason: "adjustment",
    export_fingerprint: fingerprint ?? null,
  });
  if (error) log.error("credits.refund_failed", { err: error.message });
}
