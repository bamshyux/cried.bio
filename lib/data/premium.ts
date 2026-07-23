export type { PremiumTier, PlanTier, UserEntitlements } from "@/lib/premium/types";
export {
  getUserEntitlements,
  hasEntitlement,
  requireEntitlement,
  isPremiumUser,
  canAccessFeature,
} from "@/lib/premium/entitlements";
export { getPlanDefinition, PLAN_DEFINITIONS } from "@/lib/premium/plans";

import type { EntitlementValues } from "@/lib/premium/types";
import { PLAN_DEFINITIONS } from "@/lib/premium/plans";

/** @deprecated Use getUserEntitlements() instead */
export type LegacyPremiumEntitlements = {
  profile_id: string;
  custom_domain: boolean;
  max_featured_blocks: number;
  max_music_slots: number;
  animated_effects: boolean;
  advanced_analytics: boolean;
  updated_at: string;
};

/** @deprecated Use PLAN_DEFINITIONS.free.entitlements */
export const DEFAULT_PREMIUM_ENTITLEMENTS: Omit<LegacyPremiumEntitlements, "profile_id" | "updated_at"> = {
  custom_domain: PLAN_DEFINITIONS.free.entitlements.custom_domain,
  max_featured_blocks: PLAN_DEFINITIONS.free.entitlements.max_featured_blocks,
  max_music_slots: PLAN_DEFINITIONS.free.entitlements.max_music_tracks,
  animated_effects: PLAN_DEFINITIONS.free.entitlements.animated_effects,
  advanced_analytics: PLAN_DEFINITIONS.free.entitlements.advanced_analytics,
};

/** @deprecated Use PLAN_DEFINITIONS.premium_lite.entitlements */
export const PREMIUM_ENTITLEMENTS: Omit<LegacyPremiumEntitlements, "profile_id" | "updated_at"> = {
  custom_domain: PLAN_DEFINITIONS.premium_lite.entitlements.custom_domain,
  max_featured_blocks: PLAN_DEFINITIONS.premium_lite.entitlements.max_featured_blocks,
  max_music_slots: PLAN_DEFINITIONS.premium_lite.entitlements.max_music_tracks,
  animated_effects: PLAN_DEFINITIONS.premium_lite.entitlements.animated_effects,
  advanced_analytics: PLAN_DEFINITIONS.premium_lite.entitlements.advanced_analytics,
};

function toLegacy(entitlements: EntitlementValues & { profile_id: string }): LegacyPremiumEntitlements {
  return {
    profile_id: entitlements.profile_id,
    custom_domain: entitlements.custom_domain,
    max_featured_blocks: entitlements.max_featured_blocks,
    max_music_slots: entitlements.max_music_tracks,
    animated_effects: entitlements.animated_effects,
    advanced_analytics: entitlements.advanced_analytics,
    updated_at: new Date().toISOString(),
  };
}

/** @deprecated Use getUserEntitlements() */
export async function getPremiumEntitlements(profileId: string): Promise<LegacyPremiumEntitlements> {
  const { getUserEntitlements } = await import("@/lib/premium/entitlements");
  const entitlements = await getUserEntitlements(profileId);
  return toLegacy(entitlements);
}
