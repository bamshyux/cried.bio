import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getPlanDefinition, normalizePlanTier } from "@/lib/premium/plans";
import type {
  EntitlementKey,
  EntitlementValues,
  FeatureReleaseStage,
  PlanTier,
  UserEntitlements,
} from "@/lib/premium/types";

function isSubscriptionActive(input: {
  tier: PlanTier;
  premium_expires_at: string | null;
  lifetime: boolean;
}): boolean {
  if (input.tier === "free") return false;
  if (input.lifetime) return true;
  if (!input.premium_expires_at) return true;
  return new Date(input.premium_expires_at) > new Date();
}

async function loadEntitlementsUncached(profileId: string): Promise<UserEntitlements> {
  const supabase = await createClient();

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase
      .from("profiles")
      .select("premium_tier, premium_expires_at")
      .eq("id", profileId)
      .maybeSingle(),
    supabase
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", profileId)
      .in("status", ["active", "trialing"])
      .order("lifetime", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const tier = normalizePlanTier(profile?.premium_tier);
  const lifetime = Boolean(subscription?.lifetime);
  const active = isSubscriptionActive({
    tier,
    premium_expires_at: profile?.premium_expires_at ?? null,
    lifetime,
  });

  const effectiveTier: PlanTier = active ? tier : "free";
  const plan = getPlanDefinition(effectiveTier);

  const { data: overrides } = await supabase
    .from("premium_entitlements")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  const merged: EntitlementValues = { ...plan.entitlements };

  if (overrides && active) {
    if (typeof overrides.max_featured_blocks === "number") {
      merged.max_featured_blocks = overrides.max_featured_blocks;
    }
    if (typeof overrides.max_music_slots === "number") {
      merged.max_music_tracks = overrides.max_music_slots;
    }
    if (typeof overrides.custom_domain === "boolean") merged.custom_domain = overrides.custom_domain;
    if (typeof overrides.animated_effects === "boolean") {
      merged.animated_effects = overrides.animated_effects;
    }
    if (typeof overrides.advanced_analytics === "boolean") {
      merged.advanced_analytics = overrides.advanced_analytics;
    }
  }

  return {
    profile_id: profileId,
    plan_tier: effectiveTier,
    plan_label: plan.label,
    is_active: active,
    billing_type: (subscription?.billing_type as UserEntitlements["billing_type"]) ?? null,
    lifetime,
    current_period_end: subscription?.current_period_end ?? profile?.premium_expires_at ?? null,
    ...merged,
  };
}

/** Cached per-request entitlement resolution */
export const getUserEntitlements = cache(loadEntitlementsUncached);

export async function hasEntitlement(
  profileId: string,
  key: EntitlementKey,
): Promise<boolean> {
  const entitlements = await getUserEntitlements(profileId);
  const value = entitlements[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return false;
}

export async function requireEntitlement(
  profileId: string,
  key: EntitlementKey,
  message?: string,
): Promise<{ ok: true; entitlements: UserEntitlements } | { ok: false; error: string }> {
  const entitlements = await getUserEntitlements(profileId);
  const allowed = await hasEntitlement(profileId, key);
  if (!allowed) {
    return {
      ok: false,
      error: message ?? "This feature requires Premium Lite.",
    };
  }
  return { ok: true, entitlements };
}

export async function canAccessFeature(
  profileId: string,
  featureKey: string,
  stage?: FeatureReleaseStage,
): Promise<boolean> {
  const entitlements = await getUserEntitlements(profileId);
  let releaseStage = stage;

  if (!releaseStage) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("feature_release_flags")
      .select("release_stage")
      .eq("feature_key", featureKey)
      .maybeSingle();
    releaseStage = (data?.release_stage as FeatureReleaseStage) ?? "general";
  }

  switch (releaseStage) {
    case "general":
      return true;
    case "premium_early_access":
      return entitlements.can_access_early_features;
    case "premium_only":
      return entitlements.is_active && entitlements.plan_tier !== "free";
    default:
      return true;
  }
}

/** @deprecated Use getUserEntitlements().is_active */
export async function isPremiumUser(profileId: string): Promise<boolean> {
  const entitlements = await getUserEntitlements(profileId);
  return entitlements.is_active && entitlements.plan_tier !== "free";
}
