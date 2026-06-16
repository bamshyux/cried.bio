import type { ProfilePresetData } from "@/lib/types/profile-preset";

function sortByOrder<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

function normalizePresetForCompare(data: ProfilePresetData) {
  return {
    version: data.version,
    profile: data.profile,
    settings: data.settings,
    links: sortByOrder(data.links),
    embeds: sortByOrder(data.embeds),
    featuredBlocks: sortByOrder(data.featuredBlocks),
    profileBadges: [...data.profileBadges].sort((a, b) => a.badge_id.localeCompare(b.badge_id)),
    discordWidget: data.discordWidget,
    customTheme: data.customTheme,
    featuredLinkIndex: data.featuredLinkIndex,
  };
}

export function arePresetSnapshotsEqual(
  left: ProfilePresetData,
  right: ProfilePresetData,
): boolean {
  return (
    JSON.stringify(normalizePresetForCompare(left)) ===
    JSON.stringify(normalizePresetForCompare(right))
  );
}
