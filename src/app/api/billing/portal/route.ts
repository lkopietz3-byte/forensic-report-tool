import { logError } from "@/lib/log/logger";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { getStripe } from "@/lib/billing/stripe";
import { isSameOriginRequest } from "@/lib/http/request";
import { publicSiteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Send a Pro subscriber to the Stripe billing portal to update card / cancel.
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Billing isn't configured." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };
  const customerId = data?.stripe_customer_id as string | undefined;
  if (!customerId) {
    return NextResponse.json({ error: "No subscription to manage yet." }, { status: 400 });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: publicSiteUrl("/workspace"),
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    logError("billing.portal_failed", err);
    return NextResponse.json({ error: "Could not open billing portal." }, { status: 500 });
  }
}
