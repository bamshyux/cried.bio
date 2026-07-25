import { NextResponse } from "next/server";
import { getPurchaseBySessionId } from "@/lib/data/purchases";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { getPostCheckoutFulfillmentPath } from "@/lib/store/post-checkout";
import { resolveCheckoutPaymentDetails } from "@/lib/store/payment-details";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getClaims();
    if (authError || !data?.claims?.sub) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = data.claims.sub as string;
    let body: { sessionId?: string } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const sessionId = body.sessionId?.trim();
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price", "payment_intent", "payment_intent.payment_method", "payment_intent.latest_charge"],
    });

    if (session.metadata?.checkout_type !== "store") {
      return NextResponse.json({ error: "Not a store checkout session." }, { status: 400 });
    }

    if (session.client_reference_id !== userId && session.metadata?.cried_user_id !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ synced: false, status: session.payment_status });
    }

    const { fulfillStoreCheckout } = await import("@/lib/store/fulfillment");
    const { getStoreProductBySlug } = await import("@/lib/data/store");
    const paymentDetails = await resolveCheckoutPaymentDetails(session);

    const productSlug = session.metadata?.product_slug;
    const product = productSlug ? await getStoreProductBySlug(productSlug) : null;
    const priceId =
      session.metadata?.price_id ??
      (typeof session.line_items?.data?.[0]?.price === "object"
        ? session.line_items?.data?.[0]?.price?.id
        : null);

    const result = await fulfillStoreCheckout({
      buyerProfileId: userId,
      recipientProfileId: session.metadata?.recipient_profile_id ?? userId,
      product,
      productSlug: productSlug ?? undefined,
      priceId: priceId ?? undefined,
      stripeSessionId: session.id,
      stripePaymentIntent: paymentDetails.stripePaymentIntentId,
      stripeCustomerId: paymentDetails.stripeCustomerId,
      amountPaid: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      paymentMethod: paymentDetails.paymentMethod,
      receiptNumber: paymentDetails.receiptNumber,
      invoiceNumber: paymentDetails.invoiceNumber,
    });

    const purchase =
      (await getPurchaseBySessionId(session.id, userId)) ??
      (result.referenceId
        ? await import("@/lib/data/purchases").then(({ getPurchaseByReferenceId }) =>
            getPurchaseByReferenceId(result.referenceId!, userId),
          )
        : null);

    return NextResponse.json({
      synced: true,
      alreadyProcessed: result.alreadyProcessed,
      referenceId: purchase?.reference_id ?? result.referenceId ?? null,
      productSlug: purchase?.product_slug ?? productSlug ?? null,
      fulfillmentPath: getPostCheckoutFulfillmentPath(
        purchase?.product_slug ?? productSlug ?? "",
      ),
    });
  } catch (error) {
    console.error("[stripe sync-store]", error);
    return NextResponse.json({ error: "Could not sync store purchase." }, { status: 500 });
  }
}
