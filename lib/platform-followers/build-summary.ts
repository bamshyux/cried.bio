import type { LinkPlatformStat, TotalFollowersSummary } from "@/lib/types/link-platform-stats";

export function buildTotalFollowersSummary(items: LinkPlatformStat[]): TotalFollowersSummary {
  const available = items.filter(
    (item) => item.follower_count != null && Number.isFinite(item.follower_count),
  );
  const total = available.reduce((sum, item) => sum + (item.follower_count ?? 0), 0);

  return {
    total,
    items: [...available].sort((a, b) => (b.follower_count ?? 0) - (a.follower_count ?? 0)),
  };
}
