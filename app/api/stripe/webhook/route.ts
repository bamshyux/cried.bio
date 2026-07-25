import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { grantPremiumAccess, findUserIdByStripeCustomer, revokePremiumAccess } from "@/lib/premium/sync";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe/client";
import {
  fulfillPremiumCheckoutSession,
  resolvePremiumPlanFromPriceId,
} from "@/lib/stripe/premium-checkout";
import { getSubscriptionPeriodEndIso } from "@/lib/stripe/subscription-period";

export const runtime = "nodejs";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const checkoutType = session.metadata?.checkout_type ?? "premium";
  const buyerId =
    session.client_reference_id ??
    session.metadata?.cried_user_id ??
    (session.customer ? await findUserIdByStripeCustomer(String(session.customer)) : null);

  if (!buyerId) return;

  if (checkoutType === "store") {
    if (session.payment_status && session.payment_status !== "paid") {
      return;
    }

    const productSlug = session.metadata?.product_slug;
    const recipientId = session.metadata?.recipient_profile_id ?? buyerId;
    const priceId =
      session.metadata?.price_id ??
      (typeof session.line_items?.data?.[0]?.price === "object"
        ? session.line_items?.data?.[0]?.price?.id
        : null);

    if (!productSlug && !priceId) return;

    const { getStoreProductBySlug } = await import("@/lib/data/store");
    const { fulfillStoreCheckout } = await import("@/lib/store/fulfillment");
    const product = productSlug ? await getStoreProductBySlug(productSlug) : null;

    await fulfillStoreCheckout({
      buyerProfileId: buyerId,
      recipientProfileId: recipientId,
      product,
      productSlug: productSlug ?? undefined,
      priceId: priceId ?? undefined,
      stripeSessionId: session.id,
      stripePaymentIntent:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      amountPaid: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      isGift: session.metadata?.is_gift === "true",
      giftMessage: session.metadata?.gift_message,
      reservedUsername: session.metadata?.reserved_username,
    });
    return;
  }

  await fulfillPremiumCheckoutSession(getStripe(), session);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId =
    subscription.metadata?.cried_user_id ??
    (subscription.customer ? await findUserIdByStripeCustomer(String(subscription.customer)) : null);

  if (!userId) return;

  const priceId = subscription.items.data[0]?.price?.id ?? "";
  const stripe = getStripe();
  const plan =
    (await resolvePremiumPlanFromPriceId(stripe, priceId, { mode: "subscription" })) ?? {
      planName: "premium_lite",
      billingType: "monthly" as const,
    };

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
      currentPeriodEnd: getSubscriptionPeriodEndIso(subscription),
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
            expand: ["line_items.data.price", "subscription"],
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
