/** Plan tiers — extensible for Premium+, Creator, Enterprise */
export type PlanTier =
  | "free"
  | "premium_lite"
  | "premium"
  | "premium_plus"
  | "creator"
  | "enterprise";

/** @deprecated Use PlanTier */
export type PremiumTier = PlanTier;

export type BillingType = "monthly" | "lifetime";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "incomplete"
  | "trialing"
  | "expired";

/** Entitlement keys — never check isPremium directly in feature code */
export type EntitlementKey =
  | "can_use_playlist"
  | "can_use_multiple_profiles"
  | "can_use_scheduled_profiles"
  | "can_use_premium_fonts"
  | "can_use_custom_effect_request"
  | "can_change_username_daily"
  | "can_access_early_features"
  | "max_music_tracks"
  | "max_profile_pages"
  | "username_cooldown_hours"
  | "max_featured_blocks"
  | "custom_domain"
  | "animated_effects"
  | "advanced_analytics";

export type EntitlementValues = {
  can_use_playlist: boolean;
  can_use_multiple_profiles: boolean;
  can_use_scheduled_profiles: boolean;
  can_use_premium_fonts: boolean;
  can_use_custom_effect_request: boolean;
  can_change_username_daily: boolean;
  can_access_early_features: boolean;
  max_music_tracks: number;
  max_profile_pages: number;
  username_cooldown_hours: number;
  max_featured_blocks: number;
  custom_domain: boolean;
  animated_effects: boolean;
  advanced_analytics: boolean;
};

export type UserEntitlements = EntitlementValues & {
  profile_id: string;
  plan_tier: PlanTier;
  plan_label: string;
  is_active: boolean;
  billing_type: BillingType | null;
  lifetime: boolean;
  current_period_end: string | null;
};

export type PremiumSubscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string;
  plan_name: string;
  billing_type: BillingType;
  status: SubscriptionStatus;
  lifetime: boolean;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type FeatureReleaseStage = "general" | "premium_early_access" | "premium_only";

export const PREMIUM_LITE_PRICE_MONTHLY = "price_1TwIaICZc2iqkh61zEPWgoKP";
export const PREMIUM_LITE_PRICE_LIFETIME = "price_1TwIbfCZc2iqkh61zEPuw90fu";
