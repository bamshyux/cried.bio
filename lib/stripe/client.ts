import Stripe from "stripe";
import { getStripeCheckoutConfigStatus } from "@/lib/stripe/config";

/** Required for Stripe Managed Payments (Checkout subscriptions) */
const STRIPE_API_VERSION = "2025-03-31.basil" as Stripe.LatestApiVersion;

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const status = getStripeCheckoutConfigStatus();
  const key = status.configured ? process.env.STRIPE_SECRET_KEY!.trim() : "";
  if (!key) {
    throw new Error(
      getStripeConfigErrorMessage(status) ?? "STRIPE_SECRET_KEY is not configured.",
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: STRIPE_API_VERSION });
  }
  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  return secret;
}

export function isStripeConfigured(): boolean {
  return getStripeCheckoutConfigStatus().configured;
}

export function getStripeConfigErrorMessage(
  status = getStripeCheckoutConfigStatus(),
): string | null {
  if (status.configured) return null;
  return `Stripe is not configured. Add these environment variables: ${status.missing.join(", ")}`;
}
