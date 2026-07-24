import type { ProfileLayout } from "@/lib/types/settings";
import { LAYOUT_OPTIONS } from "@/lib/settings";

const PREMIUM_PROFILE_LAYOUTS = new Set<ProfileLayout>(
  LAYOUT_OPTIONS.filter((option) => option.premiumOnly).map((option) => option.value),
);

export function isPremiumProfileLayout(layout: ProfileLayout | string): boolean {
  return PREMIUM_PROFILE_LAYOUTS.has(layout as ProfileLayout);
}

export function sanitizeProfileLayoutSelection(
  layout: ProfileLayout,
  canUsePremiumLayouts: boolean,
): ProfileLayout {
  if (canUsePremiumLayouts || !isPremiumProfileLayout(layout)) return layout;
  return "classic";
}

export function enforceProfileLayoutEntitlement(
  layout: ProfileLayout,
  canUsePremiumLayouts: boolean,
): ProfileLayout {
  return sanitizeProfileLayoutSelection(layout, canUsePremiumLayouts);
}
