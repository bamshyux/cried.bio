export type PremiumTier = "free" | "premium";

export type PremiumEntitlements = {
  profile_id: string;
  custom_domain: boolean;
  max_featured_blocks: number;
  max_music_slots: number;
  animated_effects: boolean;
  advanced_analytics: boolean;
  updated_at: string;
};

export const DEFAULT_PREMIUM_ENTITLEMENTS: Omit<PremiumEntitlements, "profile_id" | "updated_at"> = {
  custom_domain: false,
  max_featured_blocks: 3,
  max_music_slots: 1,
  animated_effects: false,
  advanced_analytics: false,
};

export const PREMIUM_ENTITLEMENTS: Omit<PremiumEntitlements, "profile_id" | "updated_at"> = {
  custom_domain: true,
  max_featured_blocks: 12,
  max_music_slots: 3,
  animated_effects: true,
  advanced_analytics: true,
};
