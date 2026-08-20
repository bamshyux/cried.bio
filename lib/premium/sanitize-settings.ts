import { isPremiumFont } from "@/lib/premium/fonts";
import { PLAN_DEFINITIONS } from "@/lib/premium/plans";
import type { UserEntitlements } from "@/lib/premium/types";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { ProfileSettings } from "@/lib/types/settings";

const FREE = PLAN_DEFINITIONS.free.entitlements;

export function sanitizeSettingsForEntitlements(
  settings: ProfileSettings,
  entitlements: UserEntitlements,
): ProfileSettings {
  let next = settings;

  if (!entitlements.can_use_premium_fonts) {
    const fontFamily = isPremiumFont(settings.font_family)
      ? DEFAULT_SETTINGS.font_family
      : settings.font_family;
    const bioFontFamily =
      settings.bio_font_family && isPremiumFont(settings.bio_font_family)
        ? ""
        : settings.bio_font_family;
    const enterGateFontFamily =
      settings.enter_gate_font_family && isPremiumFont(settings.enter_gate_font_family)
        ? ""
        : settings.enter_gate_font_family;

    if (
      fontFamily !== settings.font_family ||
      bioFontFamily !== settings.bio_font_family ||
      enterGateFontFamily !== settings.enter_gate_font_family
    ) {
      next = {
        ...next,
        font_family: fontFamily,
        bio_font_family: bioFontFamily,
        enter_gate_font_family: enterGateFontFamily,
      };
    }
  }

  if (!entitlements.can_use_playlist) {
    if (
      settings.music_playlist_mode ||
      settings.music_shuffle ||
      settings.music_autoplay_next
    ) {
      next = {
        ...next,
        music_playlist_mode: false,
        music_shuffle: false,
        music_autoplay_next: false,
      };
    }
  }

  if (!entitlements.can_use_multiple_profiles && settings.page_nav_position !== "top") {
    next = { ...next, page_nav_position: "top" };
  }

  return next;
}

export function trimFeaturedForEntitlements<T>(
  blocks: T[],
  entitlements: UserEntitlements,
): T[] {
  const limit = entitlements.is_active
    ? entitlements.max_featured_blocks
    : FREE.max_featured_blocks;
  return blocks.slice(0, limit);
}
