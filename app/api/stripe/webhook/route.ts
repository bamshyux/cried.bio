import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { grantPremiumAccess, findUserIdByStripeCustomer, revokePremiumAccess } from "@/lib/premium/sync";
import { resolveCheckoutPlan } from "@/lib/stripe/prices";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe/client";

export const runtime = "nodejs";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const checkoutType = session.metadata?.checkout_type ?? "premium";
  const buyerId =
    session.client_reference_id ??
    session.metadata?.cried_user_id ??
    (session.customer ? await findUserIdByStripeCustomer(String(session.customer)) : null);

  if (!buyerId) return;

  if (checkoutType === "store") {
    const productSlug = session.metadata?.product_slug;
    const recipientId = session.metadata?.recipient_profile_id ?? buyerId;
    if (!productSlug) return;

    const { getStoreProductBySlug } = await import("@/lib/data/store");
    const { fulfillStoreProduct } = await import("@/lib/store/fulfillment");
    const product = await getStoreProductBySlug(productSlug);
    if (!product) return;

    await fulfillStoreProduct({
      buyerProfileId: buyerId,
      recipientProfileId: recipientId,
      product,
      stripeSessionId: session.id,
      amountCents: session.amount_total ?? product.price_cents,
      isGift: session.metadata?.is_gift === "true",
      giftMessage: session.metadata?.gift_message,
      reservedUsername: session.metadata?.reserved_username,
    });
    return;
  }

  const recipientId =
    session.metadata?.recipient_profile_id && session.metadata?.is_gift === "true"
      ? session.metadata.recipient_profile_id
      : buyerId;

  const userId = recipientId;

  const priceId =
    session.metadata?.price_id ??
    (session.mode === "subscription" ? null : session.metadata?.price_id);

  const lineItems = session.line_items?.data?.length
    ? session.line_items.data
    : null;

  let resolvedPriceId = priceId ?? "";
  if (!resolvedPriceId && lineItems?.[0]?.price?.id) {
    resolvedPriceId = lineItems[0].price.id;
  }

  const plan = resolveCheckoutPlan(resolvedPriceId);
  if (!plan) return;

  const isLifetime = plan.billingType === "lifetime" || session.mode === "payment";

  await grantPremiumAccess({
    userId,
    stripeCustomerId: String(session.customer ?? ""),
    stripeSubscriptionId: isLifetime ? null : String(session.subscription ?? ""),
    stripePriceId: resolvedPriceId,
    planName: plan.planName,
    billingType: plan.billingType,
    lifetime: isLifetime,
    status: "active",
    currentPeriodEnd: isLifetime
      ? null
      : session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : null,
  });

  if (
    session.metadata?.is_gift === "true" &&
    session.metadata?.recipient_profile_id &&
    session.metadata.recipient_profile_id !== buyerId
  ) {
    const { syncGifterBadge } = await import("@/lib/store/fulfillment");
    await syncGifterBadge(buyerId);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId =
    subscription.metadata?.cried_user_id ??
    (subscription.customer ? await findUserIdByStripeCustomer(String(subscription.customer)) : null);

  if (!userId) return;

  const priceId = subscription.items.data[0]?.price?.id ?? "";
  const plan = resolveCheckoutPlan(priceId);
  if (!plan) return;

  const active = subscription.status === "active" || subscription.status === "trialing";

  if (active) {
    await grantPremiumAccess({
      userId,
      stripeCustomerId: String(subscription.customer ?? ""),
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      planName: plan.planName,
      billingType: "monthly",
      lifetime: false,
      status: subscription.status as "active" | "trialing",
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    });
    return;
  }

  if (subscription.status === "canceled" || subscription.status === "unpaid" || subscription.status === "past_due") {
    await revokePremiumAccess(userId, subscription.status === "past_due" ? "past_due" : "canceled");
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId =
    subscription.metadata?.cried_user_id ??
    (subscription.customer ? await findUserIdByStripeCustomer(String(subscription.customer)) : null);

  if (!userId) return;
  await revokePremiumAccess(userId, "canceled");
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, getStripeWebhookSecret());
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" || session.mode === "payment") {
          const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ["line_items"],
          });
          await handleCheckoutCompleted(fullSession);
        }
        break;
      }
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription && invoice.customer) {
          const userId = await findUserIdByStripeCustomer(String(invoice.customer));
          if (userId) await revokePremiumAccess(userId, "past_due");
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook]", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
