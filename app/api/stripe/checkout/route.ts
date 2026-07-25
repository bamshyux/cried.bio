import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";
import { getStripe, getStripeConfigErrorMessage, isStripeConfigured } from "@/lib/stripe/client";
import { getStripePriceIds, isValidStripePriceId } from "@/lib/stripe/config";

export const runtime = "nodejs";

function stripeErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Could not start checkout. Please try again.";
}

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: getStripeConfigErrorMessage() ?? "Stripe is not configured." },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getClaims();
    if (authError || !data?.claims?.sub) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = data.claims.sub as string;
    let body: { priceId?: string; plan?: "monthly" | "lifetime"; recipientUsername?: string; giftMessage?: string; premiumGift?: boolean } = {};

    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const prices = getStripePriceIds();

    let priceId = body.priceId?.trim() ?? "";
    if (!priceId && body.plan === "monthly") priceId = prices.monthly;
    if (!priceId && body.plan === "lifetime") priceId = prices.lifetime;

    if (!priceId || !isValidStripePriceId(priceId)) {
      return NextResponse.json({ error: "Invalid price." }, { status: 400 });
    }

    const stripe = getStripe();
    const siteUrl = getSiteUrl();

    let customerId = "";

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, username")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[stripe checkout] profile lookup failed:", profileError.message);
    } else {
      customerId = profile?.stripe_customer_id?.trim() || "";
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: (data.claims.email as string | undefined) ?? undefined,
        metadata: { cried_user_id: userId },
      });
      customerId = customer.id;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);

      if (updateError) {
        console.error("[stripe checkout] could not save stripe_customer_id:", updateError.message);
      }
    }

    const isLifetime = priceId === prices.lifetime;
    const isPremiumGift = Boolean(body.premiumGift && body.recipientUsername?.trim());
    let recipientProfileId = userId;

    if (isPremiumGift) {
      const validation = await import("@/lib/gifts/validation").then(({ validateGiftRecipient }) =>
        validateGiftRecipient({
          recipientUsername: body.recipientUsername!,
          buyerUserId: userId,
          buyerUsername: profile?.username ?? null,
          target: { kind: "premium", plan: isLifetime ? "lifetime" : "monthly" },
        }),
      );

      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      recipientProfileId = validation.recipientId;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      client_reference_id: userId,
      mode: isLifetime ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard/premium/plans?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/dashboard/premium/plans?checkout=canceled`,
      metadata: {
        checkout_type: "premium",
        cried_user_id: userId,
        recipient_profile_id: recipientProfileId,
        is_gift: isPremiumGift ? "true" : "false",
        gift_message: body.giftMessage?.trim() ?? "",
        price_id: priceId,
      },
    };

    if (!isLifetime) {
      sessionParams.subscription_data = {
        metadata: {
          cried_user_id: recipientProfileId,
          price_id: priceId,
          is_gift: isPremiumGift ? "true" : "false",
        },
      };
    } else {
      sessionParams.payment_intent_data = {
        metadata: {
          cried_user_id: userId,
          recipient_profile_id: recipientProfileId,
          price_id: priceId,
          billing_type: "lifetime",
          is_gift: isPremiumGift ? "true" : "false",
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe checkout]", error);
    return NextResponse.json({ error: stripeErrorMessage(error) }, { status: 500 });
  }
}
