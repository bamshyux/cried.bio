import type Stripe from "stripe";

type SubscriptionLike = Pick<Stripe.Subscription, "items"> & {
  current_period_end?: number | null;
};

/** Basil API stores billing periods on subscription items, not the subscription root. */
export function getSubscriptionPeriodEndUnix(subscription: SubscriptionLike): number | null {
  const fromItems = subscription.items?.data
    ?.map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number" && value > 0);

  if (fromItems?.length) {
    return Math.min(...fromItems);
  }

  if (typeof subscription.current_period_end === "number" && subscription.current_period_end > 0) {
    return subscription.current_period_end;
  }

  return null;
}

export function getSubscriptionPeriodEndIso(subscription: SubscriptionLike): string | null {
  const unix = getSubscriptionPeriodEndUnix(subscription);
  return unix ? new Date(unix * 1000).toISOString() : null;
}
