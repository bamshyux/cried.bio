export type StripeConfig = {
  publishableKey: string;
  secretKey: string;
  monthlyPriceId: string;
  lifetimePriceId: string;
  webhookSecret: string;
};

export type StripeConfigStatus = {
  configured: boolean;
  missing: string[];
  prices: {
    monthly: string;
    lifetime: string;
  };
  publishableKey: string;
};

const ENV_KEYS = {
  publishableKey: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  secretKey: "STRIPE_SECRET_KEY",
  monthlyPriceId: "STRIPE_PREMIUM_MONTHLY_PRICE_ID",
  lifetimePriceId: "STRIPE_PREMIUM_LIFETIME_PRICE_ID",
  webhookSecret: "STRIPE_WEBHOOK_SECRET",
} as const;

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

/** Variables required for checkout buttons to work */
export function getStripeCheckoutConfigStatus(): StripeConfigStatus {
  const missing: string[] = [];

  const publishableKey = readEnv(ENV_KEYS.publishableKey);
  const secretKey = readEnv(ENV_KEYS.secretKey);
  const monthly = readEnv(ENV_KEYS.monthlyPriceId);
  const lifetime = readEnv(ENV_KEYS.lifetimePriceId);

  if (!publishableKey) missing.push(ENV_KEYS.publishableKey);
  if (!secretKey) missing.push(ENV_KEYS.secretKey);
  if (!monthly) missing.push(ENV_KEYS.monthlyPriceId);
  if (!lifetime) missing.push(ENV_KEYS.lifetimePriceId);

  return {
    configured: missing.length === 0,
    missing,
    prices: { monthly, lifetime },
    publishableKey,
  };
}

/** All Stripe env vars including webhook (needed for subscription sync) */
export function getStripeConfigStatus(): StripeConfigStatus & { webhookConfigured: boolean } {
  const checkout = getStripeCheckoutConfigStatus();
  const webhookSecret = readEnv(ENV_KEYS.webhookSecret);

  return {
    ...checkout,
    missing: webhookSecret
      ? checkout.missing
      : [...checkout.missing, ENV_KEYS.webhookSecret],
    webhookConfigured: Boolean(webhookSecret),
  };
}

export function getStripeConfigError(status = getStripeCheckoutConfigStatus()): string | null {
  if (status.configured) return null;
  return `Stripe is not fully configured. Missing: ${status.missing.join(", ")}`;
}

export function requireStripeCheckoutConfig(): StripeConfig {
  const status = getStripeCheckoutConfigStatus();
  const error = getStripeConfigError(status);
  if (error) throw new Error(error);

  return {
    publishableKey: status.publishableKey,
    secretKey: readEnv(ENV_KEYS.secretKey),
    monthlyPriceId: status.prices.monthly,
    lifetimePriceId: status.prices.lifetime,
    webhookSecret: readEnv(ENV_KEYS.webhookSecret),
  };
}

export function getStripePriceIds() {
  const status = getStripeCheckoutConfigStatus();
  return status.prices;
}

export function isValidStripePriceId(priceId: string): boolean {
  const { monthly, lifetime } = getStripePriceIds();
  if (!monthly && !lifetime) return false;
  return priceId === monthly || priceId === lifetime;
}

export function resolveCheckoutPlan(priceId: string): {
  planName: string;
  billingType: "monthly" | "lifetime";
} | null {
  const { monthly, lifetime } = getStripePriceIds();
  if (priceId === monthly) return { planName: "premium_lite", billingType: "monthly" };
  if (priceId === lifetime) return { planName: "premium_lite", billingType: "lifetime" };
  return null;
}
