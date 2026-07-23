import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";
import { getStripeCustomerId } from "@/lib/data/premium-subscription";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const userId = data.claims.sub as string;
  const customerId = await getStripeCustomerId(userId);

  if (!customerId) {
    return NextResponse.json({ error: "No billing account found." }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getSiteUrl()}/dashboard/premium`,
  });

  return NextResponse.json({ url: session.url });
}
