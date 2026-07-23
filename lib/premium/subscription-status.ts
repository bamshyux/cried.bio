import { normalizePlanTier } from "@/lib/premium/plans";
import type { PlanTier } from "@/lib/premium/types";

export function isSubscriptionActive(input: {
  tier: PlanTier;
  premium_expires_at: string | null;
  lifetime: boolean;
}): boolean {
  if (input.tier === "free") return false;
  if (input.lifetime) return true;
  if (!input.premium_expires_at) return true;
  return new Date(input.premium_expires_at) > new Date();
}

export function resolvePremiumActiveState(input: {
  premium_tier: string | null | undefined;
  premium_expires_at: string | null | undefined;
  lifetime: boolean;
}): { tier: PlanTier; active: boolean } {
  const tier = normalizePlanTier(input.premium_tier);
  const active = isSubscriptionActive({
    tier,
    premium_expires_at: input.premium_expires_at ?? null,
    lifetime: input.lifetime,
  });
  return { tier, active };
}
