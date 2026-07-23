import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";
import { getStripeCustomerId } from "@/lib/data/premium-subscription";
import { getStripe, getStripeConfigErrorMessage, isStripeConfigured } from "@/lib/stripe/client";

export const runtime = "nodejs";

export async function POST() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: getStripeConfigErrorMessage() ?? "Stripe is not configured." },
        { status: 503 },
      );
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

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a portal URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe portal]", error);
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: string }).message)
        : "Could not open billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
