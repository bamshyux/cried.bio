import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardResult,
  LeaderboardTab,
} from "@/lib/types/leaderboard";
import { LEADERBOARD_PAGE_SIZE } from "@/lib/types/leaderboard";

type LeaderboardRow = {
  profile_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  stat_count: number | string | null;
  follower_count?: number | string | null;
  view_count?: number | string | null;
  total_count: number | string | null;
};

function periodSince(period: LeaderboardPeriod): string | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }
  const d = new Date(now);
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

async function db() {
  return createAdminClient() ?? (await createClient());
}

async function getFollowingSet(userId: string, profileIds: string[]): Promise<Set<string>> {
  if (!profileIds.length) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId)
    .in("following_id", profileIds);
  return new Set((data ?? []).map((row) => row.following_id));
}

function mapRows(
  rows: LeaderboardRow[],
  tab: LeaderboardTab,
  page: number,
  pageSize: number,
  period: LeaderboardPeriod,
  query: string,
  following: Set<string>,
  skipTop = 0,
): LeaderboardResult {
  const total = rows.length > 0 ? Number(rows[0].total_count) || 0 : 0;
  const rankOffset = skipTop + (page - 1) * pageSize;

  const entries: LeaderboardEntry[] = rows.map((row, index) => {
    const stat = Number(row.stat_count) || 0;
    const followers = Number(row.follower_count) || (tab === "followers" ? stat : 0);
    const views = Number(row.view_count) ?? (tab === "views" ? stat : 0);

    return {
      id: row.profile_id,
      username: row.username,
      display_name: row.display_name?.trim() || row.username,
      avatar_url: row.avatar_url,
      bio: row.bio?.trim() || "",
      rank: rankOffset + index + 1,
      stat_count: stat,
      views: tab === "views" ? stat : views,
      followers: tab === "followers" ? stat : followers,
      is_following: following.has(row.profile_id),
    };
  });

  return {
    entries,
    total,
    page,
    pageSize,
    totalPages: total > 0 ? Math.ceil(total / pageSize) : 0,
    tab,
    period,
    query,
  };
}

export async function fetchLeaderboard(options: {
  tab: LeaderboardTab;
  period?: LeaderboardPeriod;
  query?: string;
  page?: number;
  pageSize?: number;
  userId?: string;
  /** Skip top N ranks (e.g. 3 when podium shows the leaders). */
  skipTop?: number;
}): Promise<LeaderboardResult> {
  const supabase = await db();
  const tab = options.tab;
  const period = options.period ?? "all";
  const query = options.query?.trim() ?? "";
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? LEADERBOARD_PAGE_SIZE));
  const skipTop = Math.max(0, options.skipTop ?? 0);
  const offset = skipTop + (page - 1) * pageSize;
  const since = periodSince(period);

  const rpcName =
    tab === "views" ? "get_most_viewed_leaderboard" : "get_most_followed_leaderboard";

  const { data, error } = await supabase.rpc(rpcName, {
    p_since: since,
    p_search: query || null,
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error || !data) {
    return {
      entries: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      tab,
      period,
      query,
    };
  }

  const rows = data as LeaderboardRow[];
  const profileIds = rows.map((row) => row.profile_id);
  const following = options.userId
    ? await getFollowingSet(options.userId, profileIds)
    : new Set<string>();

  const result = mapRows(rows, tab, page, pageSize, period, query, following, skipTop);
  if (skipTop > 0 && result.total > 0) {
    const listTotal = Math.max(0, result.total - skipTop);
    result.totalPages = listTotal > 0 ? Math.ceil(listTotal / pageSize) : 0;
  }
  return result;
}

export async function fetchLeaderboardPodium(
  tab: LeaderboardTab,
  period: LeaderboardPeriod,
  query: string,
  userId?: string,
): Promise<LeaderboardEntry[]> {
  const result = await fetchLeaderboard({
    tab,
    period,
    query,
    page: 1,
    pageSize: 3,
    userId,
  });
  return result.entries;
}
