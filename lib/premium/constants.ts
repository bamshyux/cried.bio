import type { UserEntitlements } from "@/lib/premium/types";

export const PREMIUM_LITE_MONTHLY_PRICE = 1.99;
export const PREMIUM_LITE_LIFETIME_PRICE = 19.99;

export const PREMIUM_LITE_BENEFITS = [
  "Up to 10 music tracks with playlist mode",
  "4 additional profile pages",
  "Scheduled profile presets",
  "Premium font library",
  "Profile picture border effects",
  "100 MB maximum upload size",
  "Custom profile effect request",
  "24-hour username changes",
  "Premium badge on your profile",
  "Early access to new features",
] as const;

export function getTierDisplayName(entitlements: UserEntitlements): string {
  if (!entitlements.is_active || entitlements.plan_tier === "free") return "Free";
  return entitlements.plan_label;
}

export function getBillingLabel(entitlements: UserEntitlements): string | null {
  if (!entitlements.is_active) return null;
  if (entitlements.lifetime) return "Lifetime";
  if (entitlements.billing_type === "monthly") return "Monthly";
  return null;
}
