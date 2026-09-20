import { getPublicViewCount } from "@/lib/data/analytics";
import { getProfileVisibility, shouldHideViewCounts } from "@/lib/data/account-settings";
import { getBadgesByProfileId } from "@/lib/data/badges";
import { lookupProfileByUsername } from "@/lib/data/profiles";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { getFollowCounts } from "@/lib/data/social";
import { DatabaseUnavailableError } from "@/lib/db/errors";
import { parseTabTitleAnimation } from "@/lib/settings";
import { resolveOgBackground } from "@/lib/og/resolve-background";
import type { OgProfileSnapshot } from "@/lib/og/types";

export async function getOgProfileSnapshot(
  username: string,
): Promise<OgProfileSnapshot | null> {
  const lookup = await lookupProfileByUsername(username);
  if (lookup.status === "unavailable") throw new DatabaseUnavailableError();
  if (lookup.status !== "ok") return null;
  const profile = lookup.profile;
  const handle = profile.username?.trim();
  if (!handle) return null;

  const visibility = await getProfileVisibility(profile.id);
  if (visibility === "private") return null;

  const [settings, badges, followCounts, views, hideViews] = await Promise.all([
    getSettingsByProfileId(profile.id),
    getBadgesByProfileId(profile.id),
    getFollowCounts(profile.id),
    getPublicViewCount(profile.id),
    shouldHideViewCounts(profile.id),
  ]);

  const displayName = profile.display_name?.trim() || handle;
  const bio =
    profile.bio?.trim() ||
    `${displayName} on cried.bio/${handle}`;

  const visibleBadges = badges
    .filter((badge) => badge.is_visible)
    .slice(0, Math.max(1, settings.badge_display_limit || 5))
    .map((badge) => ({
      name: badge.name,
      color: badge.color,
      slug: badge.slug,
    }));

  return {
    username: handle,
    displayName,
    bio: bio.slice(0, 160),
    avatarUrl: profile.avatar_url,
    background: resolveOgBackground(settings),
    accentColor: settings.accent_color || "#fafafa",
    textColor: settings.text_color || "#fafafa",
    cardOpacity: Math.min(100, Math.max(55, settings.profile_opacity || 88)),
    badges: settings.show_badges ? visibleBadges : [],
    followers: followCounts.followers,
    views: hideViews ? null : views,
    showViews: settings.show_view_count && !hideViews,
    faviconUrl: settings.profile_favicon_url,
    tabTitleAnimation: parseTabTitleAnimation(settings.tab_title_animation),
  };
}
