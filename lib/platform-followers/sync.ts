import { getLinksByProfileId } from "@/lib/data/links";
import { fetchPlatformStats } from "@/lib/platform-followers/fetch-stats";
import { parseSocialLink } from "@/lib/platform-followers/parse-link";
import { createClient } from "@/lib/supabase/server";
import type { TotalFollowersSummary } from "@/lib/types/link-platform-stats";
import type { LinkPlatformStat } from "@/lib/types/link-platform-stats";

const STALE_MS = 6 * 60 * 60 * 1000;

function isStale(fetchedAt: string | null | undefined): boolean {
  if (!fetchedAt) return true;
  const ts = new Date(fetchedAt).getTime();
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > STALE_MS;
}

function mapRow(row: Record<string, unknown>): LinkPlatformStat {
  return {
    link_id: String(row.link_id),
    platform: String(row.platform),
    platform_username: row.platform_username ? String(row.platform_username) : null,
    display_name: row.display_name ? String(row.display_name) : null,
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
    follower_count:
      row.follower_count == null ? null : Number.parseInt(String(row.follower_count), 10),
    count_label: String(row.count_label ?? "Followers"),
    fetched_at: row.fetched_at ? String(row.fetched_at) : null,
  };
}

export function buildTotalFollowersSummary(items: LinkPlatformStat[]): TotalFollowersSummary {
  const counted = items.filter(
    (item) => item.follower_count != null && Number.isFinite(item.follower_count),
  );
  const total = counted.reduce((sum, item) => sum + (item.follower_count ?? 0), 0);

  return {
    total,
    items: [...counted].sort((a, b) => (b.follower_count ?? 0) - (a.follower_count ?? 0)),
  };
}

export async function getLinkPlatformStats(profileId: string): Promise<LinkPlatformStat[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("link_platform_stats")
    .select(
      "link_id, platform, platform_username, display_name, avatar_url, follower_count, count_label, fetched_at",
    )
    .eq("profile_id", profileId);

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getTotalFollowersSummary(profileId: string): Promise<TotalFollowersSummary> {
  const items = await getLinkPlatformStats(profileId);
  return buildTotalFollowersSummary(items);
}

export async function syncLinkPlatformStats(profileId: string, options?: { force?: boolean }): Promise<void> {
  const links = await getLinksByProfileId(profileId);
  const socialLinks = links.map(parseSocialLink).filter((link): link is NonNullable<typeof link> => link !== null);

  if (socialLinks.length === 0) {
    const supabase = await createClient();
    await supabase.from("link_platform_stats").delete().eq("profile_id", profileId);
    return;
  }

  const existing = await getLinkPlatformStats(profileId);
  const existingByLink = new Map(existing.map((row) => [row.link_id, row]));
  const activeLinkIds = new Set(socialLinks.map((link) => link.linkId));

  const supabase = await createClient();

  for (const staleRow of existing) {
    if (!activeLinkIds.has(staleRow.link_id)) {
      await supabase.from("link_platform_stats").delete().eq("link_id", staleRow.link_id);
    }
  }

  for (const link of socialLinks) {
    const cached = existingByLink.get(link.linkId);
    if (!options?.force && cached && !isStale(cached.fetched_at)) continue;

    const stats = await fetchPlatformStats(link.platformId, link.url);
    const fetchedAt = new Date().toISOString();

    await supabase.from("link_platform_stats").upsert(
      {
        link_id: link.linkId,
        profile_id: profileId,
        platform: link.platformId,
        platform_username: stats.platform_username,
        display_name: stats.display_name ?? link.title,
        avatar_url: stats.avatar_url,
        follower_count: stats.follower_count,
        count_label: stats.count_label,
        fetched_at: fetchedAt,
      },
      { onConflict: "link_id" },
    );
  }
}
