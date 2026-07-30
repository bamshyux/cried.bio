import { PROFILE_AVATAR_EFFECT_OPTIONS } from "@/lib/profile-avatar-effects/presets";
import type { ProfileAvatarEffectPreset } from "@/lib/profile-avatar-effects/presets";
import type { ProfileSettings } from "@/lib/types/settings";

const PREMIUM_PROFILE_AVATAR_EFFECTS = new Set<ProfileAvatarEffectPreset>(
  PROFILE_AVATAR_EFFECT_OPTIONS.filter((option) => option.premiumOnly).map((option) => option.value),
);

export function isPremiumProfileAvatarEffect(effect: ProfileAvatarEffectPreset | string): boolean {
  return PREMIUM_PROFILE_AVATAR_EFFECTS.has(effect as ProfileAvatarEffectPreset);
}

export function sanitizeProfileAvatarEffectSelection(
  effect: ProfileAvatarEffectPreset,
  canUsePremiumEffects: boolean,
): ProfileAvatarEffectPreset {
  if (canUsePremiumEffects || !isPremiumProfileAvatarEffect(effect)) return effect;
  return "none";
}

export function enforceProfileAvatarEffectEntitlement(
  settings: ProfileSettings,
  canUsePremiumEffects: boolean,
): ProfileSettings {
  if (canUsePremiumEffects || !isPremiumProfileAvatarEffect(settings.profile_avatar_effect)) {
    return settings;
  }
  return { ...settings, profile_avatar_effect: "none" };
}
