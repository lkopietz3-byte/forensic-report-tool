import { log, logError } from "@/lib/log/logger";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/billing/stripe";
import { toSubscriptionRow, type StripeSubLike } from "@/lib/billing/stripeMap";
import { grantCredits } from "@/lib/billing/credits";
import { creditGrantForSession } from "@/lib/billing/creditLedger";
import { readBoundedText } from "@/lib/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_WEBHOOK_BYTES = 1_000_000;

// Stripe webhook → mirror subscription status into our `subscriptions` table.
// Writes go through the SERVICE client (RLS bypass) because a webhook has no
// user session; attribution is done by client_reference_id (checkout) or by
// looking the user up via stripe_customer_id (later subscription events). The
// upsert is keyed on user_id, so replays of the same event are idempotent.
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Billing not configured." }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const body = await readBoundedText(request, MAX_WEBHOOK_BYTES);
  if (!body.ok) return body.response;
  const raw = body.value;
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    logError("billing.webhook_signature_invalid", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const service = createServiceClient();
  const nowIso = new Date().toISOString();

  async function upsertFor(userId: string, sub: StripeSubLike) {
    const row = toSubscriptionRow(userId, sub, nowIso);
    const { error } = await service.from("subscriptions").upsert(row, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
  }

  // Idempotency: Stripe retries on any non-2xx and can deliver duplicates. If
  // we've already recorded this event id, ack and skip. (We record AFTER a
  // successful handle below, so a mid-handle crash leaves it un-recorded and
  // Stripe's retry reprocesses it — safely, since every handler is idempotent.)
  {
    const { data: seen } = await service
      .from("stripe_events")
      .select("id")
      .eq("id", event.id)
      .maybeSingle();
    if (seen) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          id: string;
          mode?: string | null;
          payment_status?: string | null;
          client_reference_id?: string | null;
          subscription?: string | null;
          metadata?: Record<string, string> | null;
        };
        const userId = session.client_reference_id ?? undefined;
        if (!userId) break;

        if (session.mode === "payment") {
          // One-time credit purchase. creditGrantForSession is the money-safety
          // guard: it returns > 0 ONLY for a genuinely PAID session with a valid
          // credit count, so an unpaid or delayed-payment checkout.session.completed
          // grants nothing (the free-credit leak). Idempotent on the session id
          // (uniq_credit_session), so a webhook replay is a no-op.
          const credits = creditGrantForSession(session);
          if (credits > 0) {
            await grantCredits(userId, credits, session.id);
          }
        } else {
          // Subscription (Pro). Retrieve the sub to mirror its status.
          const subId = session.subscription ?? undefined;
          if (subId) {
            const sub = await stripe.subscriptions.retrieve(subId);
            await upsertFor(userId, sub as unknown as StripeSubLike);
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as unknown as StripeSubLike;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const { data } = await service
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        const userId = data?.user_id as string | undefined;
        // No row yet => attribution happens on checkout.session.completed.
        if (userId) await upsertFor(userId, sub);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    logError("billing.webhook_handler_failed", err);
    // Return 500 so Stripe retries; the event id was NOT recorded, so the retry
    // will re-enter the handler (idempotently) rather than be skipped.
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  // Handled successfully — record the id so future deliveries of it are skipped.
  // A duplicate insert (concurrent delivery) is harmless: the handlers already
  // ran idempotently.
  const { error: recErr } = await service
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });
  if (recErr && recErr.code !== "23505") {
    log.error("billing.webhook_event_record_failed", { err: recErr.message });
  }

  return NextResponse.json({ received: true });
}
