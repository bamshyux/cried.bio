import {
  FREE_MAX_UPLOAD_BYTES,
  PREMIUM_MAX_UPLOAD_BYTES,
} from "@/lib/uploads/limits";
import type { EntitlementValues, PlanTier } from "@/lib/premium/types";

export type PlanDefinition = {
  tier: PlanTier;
  label: string;
  entitlements: EntitlementValues;
};

const FREE_ENTITLEMENTS: EntitlementValues = {
  can_use_playlist: false,
  can_use_multiple_profiles: false,
  can_use_scheduled_profiles: false,
  can_use_premium_fonts: false,
  can_use_custom_effect_request: false,
  can_change_username_daily: false,
  can_access_early_features: false,
  max_music_tracks: 1,
  max_profile_pages: 0,
  username_cooldown_hours: 168,
  max_featured_blocks: 3,
  custom_domain: false,
  animated_effects: false,
  advanced_analytics: false,
  max_upload_bytes: FREE_MAX_UPLOAD_BYTES,
};

const PREMIUM_LITE_ENTITLEMENTS: EntitlementValues = {
  can_use_playlist: true,
  can_use_multiple_profiles: true,
  can_use_scheduled_profiles: true,
  can_use_premium_fonts: true,
  can_use_custom_effect_request: true,
  can_change_username_daily: true,
  can_access_early_features: true,
  max_music_tracks: 10,
  max_profile_pages: 4,
  username_cooldown_hours: 24,
  max_featured_blocks: 12,
  custom_domain: true,
  animated_effects: true,
  advanced_analytics: true,
  max_upload_bytes: PREMIUM_MAX_UPLOAD_BYTES,
};

/** Future tiers inherit lite + overrides */
export const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  free: { tier: "free", label: "Free", entitlements: FREE_ENTITLEMENTS },
  premium_lite: {
    tier: "premium_lite",
    label: "Premium Lite",
    entitlements: PREMIUM_LITE_ENTITLEMENTS,
  },
  premium: {
    tier: "premium",
    label: "Premium Lite",
    entitlements: PREMIUM_LITE_ENTITLEMENTS,
  },
  premium_plus: {
    tier: "premium_plus",
    label: "Premium+",
    entitlements: {
      ...PREMIUM_LITE_ENTITLEMENTS,
      max_music_tracks: 20,
      max_profile_pages: 8,
    },
  },
  creator: {
    tier: "creator",
    label: "Creator",
    entitlements: {
      ...PREMIUM_LITE_ENTITLEMENTS,
      max_music_tracks: 30,
      max_profile_pages: 12,
    },
  },
  enterprise: {
    tier: "enterprise",
    label: "Enterprise",
    entitlements: {
      ...PREMIUM_LITE_ENTITLEMENTS,
      max_music_tracks: 50,
      max_profile_pages: 20,
      custom_domain: true,
    },
  },
};

export function normalizePlanTier(tier: string | null | undefined): PlanTier {
  const value = tier?.trim().toLowerCase() ?? "free";
  if (value in PLAN_DEFINITIONS) return value as PlanTier;
  if (value === "pro") return "premium_lite";
  return "free";
}

export function getPlanDefinition(tier: PlanTier): PlanDefinition {
  return PLAN_DEFINITIONS[tier] ?? PLAN_DEFINITIONS.free;
}
