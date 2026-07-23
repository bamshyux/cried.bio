import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { isValidStripePriceId, STRIPE_PRICES } from "@/lib/stripe/prices";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const userId = data.claims.sub as string;
  const body = (await request.json()) as { priceId?: string };
  const priceId = body.priceId?.trim() ?? "";

  if (!isValidStripePriceId(priceId)) {
    return NextResponse.json({ error: "Invalid price." }, { status: 400 });
  }

  const stripe = getStripe();
  const siteUrl = getSiteUrl();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, username")
    .eq("id", userId)
    .maybeSingle();

  let customerId = profile?.stripe_customer_id?.trim() || "";
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: (data.claims.email as string | undefined) ?? undefined,
      metadata: { cried_user_id: userId },
    });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
  }

  const isLifetime = priceId === STRIPE_PRICES.premium_lite_lifetime;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    client_reference_id: userId,
    mode: isLifetime ? "payment" : "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/dashboard/premium?checkout=success`,
    cancel_url: `${siteUrl}/dashboard/premium?checkout=canceled`,
    metadata: {
      cried_user_id: userId,
      price_id: priceId,
    },
  };

  if (!isLifetime) {
    sessionParams.subscription_data = {
      metadata: { cried_user_id: userId, price_id: priceId },
    };
  } else {
    sessionParams.payment_intent_data = {
      metadata: { cried_user_id: userId, price_id: priceId, billing_type: "lifetime" },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return NextResponse.json({ url: session.url });
}
