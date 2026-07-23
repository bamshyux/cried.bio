import { NextResponse } from "next/server";
import { getStripeCheckoutConfigStatus, getStripeConfigError } from "@/lib/stripe/config";

export function GET() {
  const status = getStripeCheckoutConfigStatus();
  const error = getStripeConfigError(status);

  return NextResponse.json({
    configured: status.configured,
    publishableKey: status.publishableKey || null,
    monthlyPriceId: status.prices.monthly || null,
    lifetimePriceId: status.prices.lifetime || null,
    error,
    missing: status.missing,
  });
}
