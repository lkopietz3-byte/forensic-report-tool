import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionRecord } from "./featureGates";

type Status = NonNullable<SubscriptionRecord>["status"];

// Reads the caller's mirrored Stripe status for the server-side tier check.
// RLS ("own subscription read") guarantees a user can only ever see their own
// row. Returns null (=> free) when there's no record or billing isn't wired.
export async function getSubscriptionFor(
  supabase: SupabaseClient,
  userId: string,
): Promise<SubscriptionRecord> {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { status: Status; current_period_end: string | null };
    return { status: row.status, currentPeriodEnd: row.current_period_end };
  } catch {
    return null;
  }
}
