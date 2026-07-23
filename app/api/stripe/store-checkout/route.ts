import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStoreProductBySlug, getProfileIdByUsername } from "@/lib/data/store";
import { getSiteUrl } from "@/lib/site";
import { getStripe, getStripeConfigErrorMessage, isStripeConfigured } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function stripeErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Could not start checkout.";
}

async function ensureCustomer(
  stripe: ReturnType<typeof getStripe>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email?: string,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  let customerId = profile?.stripe_customer_id?.trim() || "";
  if (customerId) return customerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { cried_user_id: userId },
  });
  customerId = customer.id;
  await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
  return customerId;
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

    const buyerId = data.claims.sub as string;
    let body: {
      productSlug?: string;
      recipientUsername?: string;
      giftMessage?: string;
      reservedUsername?: string;
    } = {};

    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const productSlug = body.productSlug?.trim();
    if (!productSlug) {
      return NextResponse.json({ error: "Product is required." }, { status: 400 });
    }

    const product = await getStoreProductBySlug(productSlug);
    if (!product || product.status !== "active") {
      return NextResponse.json({ error: "Product not available." }, { status: 404 });
    }

    const recipientUsername = body.recipientUsername?.trim().toLowerCase();
    const isGift = Boolean(recipientUsername);
    let recipientId = buyerId;

    if (isGift) {
      if (!product.is_giftable) {
        return NextResponse.json({ error: "This product cannot be gifted." }, { status: 400 });
      }
      const resolved = await getProfileIdByUsername(recipientUsername!);
      if (!resolved) {
        return NextResponse.json({ error: "Recipient not found." }, { status: 404 });
      }
      recipientId = resolved;
    }

    const reservedUsername = body.reservedUsername?.trim().toLowerCase();
    if (product.slug === "username-reservation" && !reservedUsername) {
      return NextResponse.json({ error: "Enter the username to reserve." }, { status: 400 });
    }

    const stripe = getStripe();
    const siteUrl = getSiteUrl();
    const customerId = await ensureCustomer(
      stripe,
      supabase,
      buyerId,
      data.claims.email as string | undefined,
    );

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = product.stripe_price_id
      ? { price: product.stripe_price_id, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            unit_amount: product.price_cents,
            product_data: {
              name: product.name,
              description: product.description.slice(0, 200),
            },
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: buyerId,
      mode: "payment",
      line_items: [lineItem],
      success_url: `${siteUrl}/dashboard/premium/store?checkout=success`,
      cancel_url: `${siteUrl}/dashboard/premium/store?checkout=canceled`,
      metadata: {
        checkout_type: "store",
        cried_user_id: buyerId,
        recipient_profile_id: recipientId,
        product_slug: product.slug,
        product_id: product.id,
        is_gift: isGift ? "true" : "false",
        gift_message: body.giftMessage?.trim() ?? "",
        reserved_username: reservedUsername ?? "",
      },
      payment_intent_data: {
        metadata: {
          checkout_type: "store",
          cried_user_id: buyerId,
          recipient_profile_id: recipientId,
          product_slug: product.slug,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe store-checkout]", error);
    return NextResponse.json({ error: stripeErrorMessage(error) }, { status: 500 });
  }
}
