import type { LinkPlatformStat, TotalFollowersSummary } from "@/lib/types/link-platform-stats";

export function buildTotalFollowersSummary(items: LinkPlatformStat[]): TotalFollowersSummary {
  const counted = items.filter(
    (item) => item.follower_count != null && Number.isFinite(item.follower_count),
  );
  const total = counted.reduce((sum, item) => sum + (item.follower_count ?? 0), 0);

  return {
    total,
    items: [...items].sort((a, b) => {
      const aScore = a.follower_count ?? -1;
      const bScore = b.follower_count ?? -1;
      return bScore - aScore;
    }),
  };
}
