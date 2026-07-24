import type Stripe from "stripe";
import { grantPremiumAccess, findUserIdByStripeCustomer } from "@/lib/premium/sync";
import { resolveCheckoutPlan } from "@/lib/stripe/config";
import { getSubscriptionPeriodEndIso } from "@/lib/stripe/subscription-period";

export function extractCheckoutPriceId(session: Stripe.Checkout.Session): string {
  const fromMetadata = session.metadata?.price_id?.trim();
  if (fromMetadata) return fromMetadata;

  const lineItem = session.line_items?.data?.[0];
  if (!lineItem?.price) return "";

  return typeof lineItem.price === "string" ? lineItem.price : lineItem.price.id;
}

export async function resolvePremiumCheckoutPlan(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  priceId: string,
): Promise<{ planName: string; billingType: "monthly" | "lifetime" } | null> {
  return resolvePremiumPlanFromPriceId(stripe, priceId, {
    mode: session.mode,
    billingType: session.metadata?.billing_type,
  });
}

export async function resolvePremiumPlanFromPriceId(
  stripe: Stripe,
  priceId: string,
  hints?: { mode?: Stripe.Checkout.Session.Mode | null; billingType?: string | null },
): Promise<{ planName: string; billingType: "monthly" | "lifetime" } | null> {
  const fromEnv = resolveCheckoutPlan(priceId);
  if (fromEnv) return fromEnv;

  if (hints?.mode === "payment") {
    return { planName: "premium_lite", billingType: "lifetime" };
  }

  if (hints?.mode === "subscription") {
    return { planName: "premium_lite", billingType: "monthly" };
  }

  if (hints?.billingType === "lifetime") {
    return { planName: "premium_lite", billingType: "lifetime" };
  }

  if (!priceId) return null;

  try {
    const price = await stripe.prices.retrieve(priceId);
    if (price.type === "one_time") {
      return { planName: "premium_lite", billingType: "lifetime" };
    }
    if (price.recurring) {
      return { planName: "premium_lite", billingType: "monthly" };
    }
  } catch {
    return null;
  }

  return null;
}

export async function resolveCheckoutPeriodEnd(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  isLifetime: boolean,
): Promise<string | null> {
  if (isLifetime) return null;

  const subscriptionRef = session.subscription;
  if (!subscriptionRef) return null;

  if (typeof subscriptionRef === "object") {
    const fromExpanded = getSubscriptionPeriodEndIso(subscriptionRef);
    if (fromExpanded) return fromExpanded;
  }

  const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return getSubscriptionPeriodEndIso(subscription);
}

export async function fulfillPremiumCheckoutSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<{ ok: true; userId: string } | { ok: false; reason: string }> {
  if (session.metadata?.checkout_type === "store") {
    return { ok: false, reason: "not_premium_checkout" };
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return { ok: false, reason: "payment_incomplete" };
  }

  const buyerId =
    session.client_reference_id ??
    session.metadata?.cried_user_id ??
    (session.customer ? await findUserIdByStripeCustomer(String(session.customer)) : null);

  if (!buyerId) return { ok: false, reason: "missing_user" };

  const recipientId =
    session.metadata?.recipient_profile_id && session.metadata?.is_gift === "true"
      ? session.metadata.recipient_profile_id
      : buyerId;

  const priceId = extractCheckoutPriceId(session);
  const plan = await resolvePremiumCheckoutPlan(stripe, session, priceId);
  if (!plan) return { ok: false, reason: "unknown_plan" };

  const isLifetime = plan.billingType === "lifetime" || session.mode === "payment";
  const currentPeriodEnd = await resolveCheckoutPeriodEnd(stripe, session, isLifetime);

  const subscriptionId = session.subscription
    ? typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id
    : null;

  await grantPremiumAccess({
    userId: recipientId,
    stripeCustomerId: String(session.customer ?? ""),
    stripeSubscriptionId: isLifetime ? null : subscriptionId,
    stripePriceId: priceId || session.metadata?.price_id || "",
    planName: plan.planName,
    billingType: plan.billingType,
    lifetime: isLifetime,
    status: "active",
    currentPeriodEnd,
  });

  if (
    session.metadata?.is_gift === "true" &&
    session.metadata?.recipient_profile_id &&
    session.metadata.recipient_profile_id !== buyerId
  ) {
    const { syncGifterBadge } = await import("@/lib/store/fulfillment");
    await syncGifterBadge(buyerId);
  }

  return { ok: true, userId: recipientId };
}

export async function syncPremiumFromStripeCustomer(
  stripe: Stripe,
  userId: string,
  customerId: string,
): Promise<boolean> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });

  const active = subscriptions.data.find(
    (subscription) => subscription.status === "active" || subscription.status === "trialing",
  );

  if (active) {
    const priceId = active.items.data[0]?.price?.id ?? "";
    const plan = (await resolvePremiumPlanFromPriceId(stripe, priceId, { mode: "subscription" })) ?? {
      planName: "premium_lite",
      billingType: "monthly" as const,
    };

    await grantPremiumAccess({
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: active.id,
      stripePriceId: priceId,
      planName: plan.planName,
      billingType: plan.billingType,
      lifetime: false,
      status: active.status as "active" | "trialing",
      currentPeriodEnd: getSubscriptionPeriodEndIso(active),
    });
    return true;
  }

  const sessions = await stripe.checkout.sessions.list({
    customer: customerId,
    limit: 10,
  });

  for (const session of sessions.data) {
    if (session.payment_status !== "paid") continue;
    if (session.metadata?.checkout_type === "store") continue;

    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items.data.price", "subscription"],
    });

    const result = await fulfillPremiumCheckoutSession(stripe, fullSession);
    if (result.ok) return true;
  }

  return false;
}
