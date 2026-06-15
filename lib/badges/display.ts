import type { ProfileBadge } from "@/lib/types/badge";
import type { ProfileSettings } from "@/lib/types/settings";

export type BadgeColorSettings = Pick<
  ProfileSettings,
  "show_badges" | "badge_display_limit" | "badges_monochrome" | "text_color"
>;

export type BadgeStyleOptions = {
  monochrome?: boolean;
  /** Applied when monochrome is on — uses profile text color from Customize */
  color?: string;
};

/** Color used for badges when monochrome mode is enabled */
export function getMonochromeBadgeColor(
  settings: Pick<ProfileSettings, "text_color">,
): string {
  return settings.text_color;
}

export function resolveBadgeColor(
  badge: Pick<ProfileBadge, "color">,
  settings: Pick<ProfileSettings, "badges_monochrome" | "text_color">,
): string {
  if (settings.badges_monochrome) return getMonochromeBadgeColor(settings);
  return badge.color;
}

export function buildBadgeStyleOptions(
  settings: Pick<ProfileSettings, "badges_monochrome" | "text_color">,
): BadgeStyleOptions {
  return {
    monochrome: settings.badges_monochrome,
    color: settings.badges_monochrome ? getMonochromeBadgeColor(settings) : undefined,
  };
}

export function applyBadgeColorSettings(
  badges: ProfileBadge[],
  settings: Pick<ProfileSettings, "badges_monochrome" | "text_color">,
): ProfileBadge[] {
  if (!settings.badges_monochrome) return badges;
  const color = getMonochromeBadgeColor(settings);
  return badges.map((badge) => ({ ...badge, color }));
}

/** Order and filter badges for public profile display */
export function preparePublicBadges(
  badges: ProfileBadge[],
  settings: BadgeColorSettings,
): ProfileBadge[] {
  if (!settings.show_badges) return [];

  const visible = badges.filter((b) => b.is_visible !== false);

  const sorted = [...visible].sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return new Date(a.assigned_at).getTime() - new Date(b.assigned_at).getTime();
  });

  const limit = settings.badge_display_limit;
  const limited = limit > 0 ? sorted.slice(0, limit) : sorted;
  return applyBadgeColorSettings(limited, settings);
}

/** Icon-only compact row next to username */
export function prepareUsernameBadges(
  badges: ProfileBadge[],
  settings: BadgeColorSettings,
  max = 4,
): ProfileBadge[] {
  return preparePublicBadges(badges, settings).slice(0, max);
}
