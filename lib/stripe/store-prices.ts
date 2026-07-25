import { getActiveStoreCatalog } from "@/lib/store/catalog";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";

export type StorePriceDisplay = {
  slug: string;
  priceId: string;
  unitAmount: number;
  currency: string;
  formatted: string;
};

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `$${(amount / 100).toFixed(2)}`;
  }
}

export async function fetchStorePriceDisplays(): Promise<Record<string, StorePriceDisplay>> {
  if (!isStripeConfigured()) return {};

  const stripe = getStripe();
  const catalog = getActiveStoreCatalog();
  const entries = await Promise.all(
    catalog.map(async (product) => {
      try {
        const price = await stripe.prices.retrieve(product.stripePriceId);
        const unitAmount = price.unit_amount ?? 0;
        const currency = price.currency ?? "usd";
        return [
          product.slug,
          {
            slug: product.slug,
            priceId: product.stripePriceId,
            unitAmount,
            currency,
            formatted: formatMoney(unitAmount, currency),
          },
        ] as const;
      } catch {
        return null;
      }
    }),
  );

  const result: Record<string, StorePriceDisplay> = {};
  for (const entry of entries) {
    if (entry) result[entry[0]] = entry[1];
  }
  return result;
}
