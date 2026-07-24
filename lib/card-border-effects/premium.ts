import { CARD_BORDER_EFFECT_OPTIONS } from "@/lib/card-border-effects/presets";
import type { CardBorderEffectPreset } from "@/lib/card-border-effects/types";
import type { ProfileSettings } from "@/lib/types/settings";

const PREMIUM_CARD_BORDER_EFFECTS = new Set<CardBorderEffectPreset>(
  CARD_BORDER_EFFECT_OPTIONS.filter((option) => option.premiumOnly).map((option) => option.value),
);

export function isPremiumCardBorderEffect(effect: CardBorderEffectPreset | string): boolean {
  return PREMIUM_CARD_BORDER_EFFECTS.has(effect as CardBorderEffectPreset);
}

export function sanitizeCardBorderEffectSelection(
  effect: CardBorderEffectPreset,
  canUsePremiumEffects: boolean,
): CardBorderEffectPreset {
  if (canUsePremiumEffects || !isPremiumCardBorderEffect(effect)) return effect;
  return "none";
}

export function enforceCardBorderEffectEntitlement(
  settings: ProfileSettings,
  canUsePremiumEffects: boolean,
): ProfileSettings {
  if (canUsePremiumEffects || !isPremiumCardBorderEffect(settings.card_border_effect)) {
    return settings;
  }
  return { ...settings, card_border_effect: "none" };
}
