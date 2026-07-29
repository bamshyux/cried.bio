import { getLinksByProfileId } from "@/lib/data/links";
import { fetchPlatformStats } from "@/lib/platform-followers/fetch-stats";
import { parseSocialLink, type ParsedSocialLink } from "@/lib/platform-followers/parse-link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { TotalFollowersSummary } from "@/lib/types/link-platform-stats";
import type { LinkPlatformStat } from "@/lib/types/link-platform-stats";

const STALE_MS = 6 * 60 * 60 * 1000;
const FAILED_RETRY_MS = 60 * 60 * 1000;
const PRIORITY_FETCH_PLATFORMS = new Set(["youtube", "twitter", "instagram", "spotify"]);

function isStale(fetchedAt: string | null | undefined, staleMs = STALE_MS): boolean {
  if (!fetchedAt) return true;
  const ts = new Date(fetchedAt).getTime();
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > STALE_MS;
}

function needsRefresh(
  cached: LinkPlatformStat | undefined,
  options?: { force?: boolean },
): boolean {
  if (options?.force) return true;
  if (!cached) return true;
  if (cached.follower_count == null) {
    if (!cached.fetched_at) return true;
    return isStale(cached.fetched_at, FAILED_RETRY_MS);
  }
  return isStale(cached.fetched_at);
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

import { buildTotalFollowersSummary } from "@/lib/platform-followers/build-summary";

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

function placeholderStatFromLink(link: ParsedSocialLink): LinkPlatformStat {
  return {
    link_id: link.linkId,
    platform: link.platformId,
    platform_username: null,
    display_name: link.title,
    avatar_url: null,
    follower_count: null,
    count_label: "Followers",
    fetched_at: null,
  };
}

async function getTrackableSocialLinks(profileId: string): Promise<ParsedSocialLink[]> {
  const links = await getLinksByProfileId(profileId);
  return links
    .map(parseSocialLink)
    .filter((link): link is ParsedSocialLink => link !== null);
}

/** Merge live links with cached stats; fetches any missing counts before returning. */
export async function getTotalFollowersSummaryForProfile(
  profileId: string,
): Promise<TotalFollowersSummary | null> {
  const socialLinks = await getTrackableSocialLinks(profileId);
  if (socialLinks.length === 0) return null;

  const stats = await getLinkPlatformStats(profileId);
  const statsByLink = new Map(stats.map((row) => [row.link_id, row]));

  const missingCountLinks = socialLinks.filter((link) => {
    const cached = statsByLink.get(link.linkId);
    if (PRIORITY_FETCH_PLATFORMS.has(link.platformId)) {
      return !cached || cached.follower_count == null;
    }
    return needsRefresh(cached);
  });

  if (missingCountLinks.length > 0) {
    const supabase = await getStatsWriteClient();
    await Promise.all(
      missingCountLinks.map(async (link) => {
        const fetched = await fetchPlatformStats(link.platformId, link.url);
        const fetchedAt = new Date().toISOString();

        const row = {
          link_id: link.linkId,
          profile_id: profileId,
          platform: link.platformId,
          platform_username: fetched.platform_username,
          display_name: fetched.display_name ?? link.title,
          avatar_url: fetched.avatar_url,
          follower_count: fetched.follower_count,
          count_label: fetched.count_label,
          fetched_at: fetchedAt,
        };

        const { error } = await supabase.from("link_platform_stats").upsert(row, { onConflict: "link_id" });
        if (error) {
          console.error(`[platform-followers] inline upsert failed for ${link.linkId}:`, error.message);
          return;
        }

        statsByLink.set(link.linkId, mapRow(row));
      }),
    );
  }

  const items = socialLinks.map((link) => statsByLink.get(link.linkId) ?? placeholderStatFromLink(link));
  return buildTotalFollowersSummary(items);
}

export async function ensureLinkPlatformStatsSynced(profileId: string): Promise<void> {
  const socialLinks = await getTrackableSocialLinks(profileId);
  if (socialLinks.length === 0) return;

  const existing = await getLinkPlatformStats(profileId);
  const existingByLink = new Map(existing.map((row) => [row.link_id, row]));
  const missingAny = socialLinks.some((link) => !existingByLink.has(link.linkId));
  const anyStale = socialLinks.some((link) => needsRefresh(existingByLink.get(link.linkId)));

  if (missingAny || anyStale) {
    await syncLinkPlatformStats(profileId, { force: missingAny });
  }
}

async function getStatsWriteClient() {
  return createAdminClient() ?? (await createClient());
}

export async function syncLinkPlatformStats(profileId: string, options?: { force?: boolean }): Promise<void> {
  const socialLinks = await getTrackableSocialLinks(profileId);

  if (socialLinks.length === 0) {
    const supabase = await getStatsWriteClient();
    await supabase.from("link_platform_stats").delete().eq("profile_id", profileId);
    return;
  }

  const existing = await getLinkPlatformStats(profileId);
  const existingByLink = new Map(existing.map((row) => [row.link_id, row]));
  const activeLinkIds = new Set(socialLinks.map((link) => link.linkId));

  const supabase = await getStatsWriteClient();

  for (const staleRow of existing) {
    if (!activeLinkIds.has(staleRow.link_id)) {
      await supabase.from("link_platform_stats").delete().eq("link_id", staleRow.link_id);
    }
  }

  const linksToRefresh: ParsedSocialLink[] = [];
  for (const link of socialLinks) {
    const cached = existingByLink.get(link.linkId);
    if (!needsRefresh(cached, options)) continue;
    linksToRefresh.push(link);
  }

  await Promise.all(
    linksToRefresh.map(async (link) => {
      const stats = await fetchPlatformStats(link.platformId, link.url);
      const fetchedAt = new Date().toISOString();

      const { error } = await supabase.from("link_platform_stats").upsert(
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

      if (error) {
        console.error(`[platform-followers] upsert failed for ${link.linkId}:`, error.message);
      }
    }),
  );
}
