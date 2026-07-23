import {
  PREMIUM_LITE_PRICE_LIFETIME,
  PREMIUM_LITE_PRICE_MONTHLY,
} from "@/lib/premium/types";

export const STRIPE_PRICES = {
  premium_lite_monthly: PREMIUM_LITE_PRICE_MONTHLY,
  premium_lite_lifetime: PREMIUM_LITE_PRICE_LIFETIME,
} as const;

export type StripeCheckoutPlan = keyof typeof STRIPE_PRICES;

export function resolveCheckoutPlan(priceId: string): {
  planName: string;
  billingType: "monthly" | "lifetime";
} | null {
  if (priceId === STRIPE_PRICES.premium_lite_monthly) {
    return { planName: "premium_lite", billingType: "monthly" };
  }
  if (priceId === STRIPE_PRICES.premium_lite_lifetime) {
    return { planName: "premium_lite", billingType: "lifetime" };
  }
  return null;
}

export function isValidStripePriceId(priceId: string): boolean {
  return Object.values(STRIPE_PRICES).includes(priceId as (typeof STRIPE_PRICES)[keyof typeof STRIPE_PRICES]);
}
