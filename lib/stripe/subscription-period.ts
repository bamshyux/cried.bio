import type Stripe from "stripe";

/** Basil API exposes billing periods on items; SDK types may lag behind. */
type PeriodFields = {
  current_period_end?: number | null;
};

function readPeriodEnd(value: PeriodFields | null | undefined): number | null {
  const end = value?.current_period_end;
  return typeof end === "number" && end > 0 ? end : null;
}

/** Basil API stores billing periods on subscription items, not always on the subscription root. */
export function getSubscriptionPeriodEndUnix(subscription: Stripe.Subscription): number | null {
  const fromItems = subscription.items?.data
    ?.map((item) => readPeriodEnd(item as PeriodFields))
    .filter((value): value is number => value !== null);

  if (fromItems?.length) {
    return Math.min(...fromItems);
  }

  return readPeriodEnd(subscription as PeriodFields);
}

export function getSubscriptionPeriodEndIso(subscription: Stripe.Subscription): string | null {
  const unix = getSubscriptionPeriodEndUnix(subscription);
  return unix ? new Date(unix * 1000).toISOString() : null;
}
