import { logError } from "@/lib/log/logger";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { isSameOriginRequest, readBoundedJson } from "@/lib/http/request";
import { getStripe, planPriceId, isBillingLive } from "@/lib/billing/stripe";
import { creditsForPlan, isCreditPlan } from "@/lib/billing/creditLedger";
import { publicSiteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Start a Stripe Checkout. `plan` selects what's bought:
//  - "single"/"pack5" → one-time payment that grants 1 / 5 report credits.
// New unlimited subscriptions are deliberately NOT sold while founding-pilot
// usage and support costs are being measured. Existing legacy Pro subscribers
// remain recognized by the webhook/entitlement code and can use the portal.
// The signed-in user's id rides along (client_reference_id + metadata) so the
// webhook can attribute the subscription or grant the credits.
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to upgrade." }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Billing isn't configured in this environment." },
      { status: 503 },
    );
  }
  // Don't take money we can't meter: refuse checkout unless billing is LIVE
  // end-to-end (enforcement flag on + Stripe + the service-role key to debit
  // credits). Otherwise a charge would buy exports that are already free.
  if (!isBillingLive()) {
    return NextResponse.json(
      { error: "Billing isn't enabled in this environment." },
      { status: 503 },
    );
  }

  const parsed = await readBoundedJson(request, 2_048);
  if (!parsed.ok) return parsed.response;
  const plan = (parsed.value as { plan?: string } | null)?.plan ?? "";
  // Stripe return destinations come from configured product state, never a
  // request Host header supplied by the caller.

  // Reuse a prior Stripe customer if we have one (RLS scopes this to the user).
  let customerId: string | undefined;
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    customerId = (data?.stripe_customer_id as string | undefined) ?? undefined;
  }
  const customerFields = customerId
    ? { customer: customerId }
    : user.email
      ? { customer_email: user.email }
      : {};

  try {
    if (isCreditPlan(plan)) {
      const price = planPriceId(plan);
      if (!price) {
        return NextResponse.json({ error: "That plan isn't configured." }, { status: 503 });
      }
      const credits = creditsForPlan(plan);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price, quantity: 1 }],
        client_reference_id: user.id,
        // The webhook reads `credits` to grant the right amount without needing
        // to re-derive it from the price.
        metadata: { credits: String(credits), plan },
        ...customerFields,
        allow_promotion_codes: true,
        success_url: publicSiteUrl(`/workspace?purchased=${credits}`),
        cancel_url: publicSiteUrl("/workspace"),
      });
      if (!session.url) throw new Error("Stripe returned no checkout URL");
      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json(
      { error: "That purchase option is not currently offered." },
      { status: 400 },
    );
  } catch (err) {
    logError("billing.checkout_failed", err);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
