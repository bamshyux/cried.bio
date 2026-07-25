import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getOwnedStoreProductSlugs } from "@/lib/data/store";
import { getSiteUrl } from "@/lib/site";
import { getStoreCatalogEntry } from "@/lib/store/catalog";
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
    let body: { productSlug?: string } = {};

    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const productSlug = body.productSlug?.trim();
    if (!productSlug) {
      return NextResponse.json({ error: "Product is required." }, { status: 400 });
    }

    const catalogEntry = getStoreCatalogEntry(productSlug);
    if (!catalogEntry) {
      return NextResponse.json({ error: "Product not available." }, { status: 404 });
    }

    if (!catalogEntry.allowRepeatPurchase) {
      const owned = await getOwnedStoreProductSlugs(buyerId);
      if (owned.has(productSlug)) {
        return NextResponse.json({ error: "You already own this item." }, { status: 400 });
      }
    }

    const stripe = getStripe();
    const siteUrl = getSiteUrl();
    const customerId = await ensureCustomer(
      stripe,
      supabase,
      buyerId,
      data.claims.email as string | undefined,
    );

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: buyerId,
      mode: "payment",
      line_items: [{ price: catalogEntry.stripePriceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard/store?success=true&product=${encodeURIComponent(productSlug)}`,
      cancel_url: `${siteUrl}/dashboard/store?cancelled=true`,
      metadata: {
        checkout_type: "store",
        cried_user_id: buyerId,
        recipient_profile_id: buyerId,
        product_slug: catalogEntry.slug,
        price_id: catalogEntry.stripePriceId,
        stripe_product_id: catalogEntry.stripeProductId,
        is_gift: "false",
      },
      payment_intent_data: {
        metadata: {
          checkout_type: "store",
          cried_user_id: buyerId,
          product_slug: catalogEntry.slug,
          price_id: catalogEntry.stripePriceId,
        },
      },
    } satisfies Stripe.Checkout.SessionCreateParams);

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe store-checkout]", error);
    return NextResponse.json({ error: stripeErrorMessage(error) }, { status: 500 });
  }
}
