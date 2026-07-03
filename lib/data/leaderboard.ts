import { isFrozenViewCountProfile } from "@/lib/analytics/frozen-view-count";
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

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  view_count: number | null;
  uid: number | null;
  view_count_frozen: boolean | null;
};

type RankedProfile = ProfileRow & {
  stat_count: number;
  view_count: number;
  follower_count: number;
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

function sanitizeSearchQuery(raw: string): string {
  return raw.trim().replace(/[%_,]/g, " ").slice(0, 64);
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

  const result: LeaderboardResult = {
    entries,
    total,
    page,
    pageSize,
    totalPages: total > 0 ? Math.ceil(total / pageSize) : 0,
    tab,
    period,
    query,
  };

  if (skipTop > 0 && total > 0) {
    const listTotal = Math.max(0, total - skipTop);
    result.totalPages = listTotal > 0 ? Math.ceil(listTotal / pageSize) : 0;
  }

  return result;
}

function matchesSearch(profile: ProfileRow, query: string): boolean {
  if (!query) return true;
  const term = query.toLowerCase();
  return (
    profile.username.toLowerCase().includes(term) ||
    (profile.display_name?.toLowerCase().includes(term) ?? false)
  );
}

async function fetchProfiles(): Promise<ProfileRow[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, view_count, uid, view_count_frozen")
    .not("username", "is", null);

  if (error || !data) return [];

  return data
    .filter((row): row is ProfileRow => typeof row.username === "string" && row.username.length > 0)
    .map((row) => ({
      id: row.id,
      username: row.username as string,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      bio: row.bio,
      view_count: row.view_count,
      uid: row.uid,
      view_count_frozen: row.view_count_frozen,
    }));
}

async function getPeriodViewCounts(since: string): Promise<Map<string, number>> {
  const supabase = await db();
  const { data } = await supabase
    .from("analytics_events")
    .select("profile_id")
    .eq("event_type", "profile_view")
    .gte("created_at", since);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.profile_id, (counts.get(row.profile_id) ?? 0) + 1);
  }
  return counts;
}

async function getFollowerCounts(since: string | null): Promise<Map<string, number>> {
  const supabase = await db();
  const { data } = await supabase.from("follows").select("following_id, created_at");

  const counts = new Map<string, number>();
  const sinceTime = since ? new Date(since).getTime() : null;

  for (const row of data ?? []) {
    if (sinceTime !== null && new Date(row.created_at).getTime() < sinceTime) continue;
    counts.set(row.following_id, (counts.get(row.following_id) ?? 0) + 1);
  }
  return counts;
}

async function buildRankedProfiles(
  tab: LeaderboardTab,
  period: LeaderboardPeriod,
  query: string,
): Promise<RankedProfile[]> {
  const since = periodSince(period);
  const [profiles, periodViews, followerCounts] = await Promise.all([
    fetchProfiles(),
    since ? getPeriodViewCounts(since) : Promise.resolve(new Map<string, number>()),
    getFollowerCounts(tab === "followers" ? since : null),
  ]);

  const allTimeFollowers =
    tab === "views" ? await getFollowerCounts(null) : followerCounts;

  const ranked = profiles
    .filter((profile) => matchesSearch(profile, query))
    .filter((profile) => (tab === "views" ? !isFrozenViewCountProfile(profile) : true))
    .map((profile) => {
      const views =
        since === null
          ? Number(profile.view_count) || 0
          : periodViews.get(profile.id) ?? 0;
      const followers = followerCounts.get(profile.id) ?? 0;

      return {
        ...profile,
        view_count: views,
        follower_count: allTimeFollowers.get(profile.id) ?? 0,
        stat_count: tab === "views" ? views : followers,
      };
    })
    .sort((a, b) => {
      if (b.stat_count !== a.stat_count) return b.stat_count - a.stat_count;
      return a.username.localeCompare(b.username);
    });

  return ranked;
}

function rankedToRows(slice: RankedProfile[], total: number): LeaderboardRow[] {
  return slice.map((profile) => ({
    profile_id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    stat_count: profile.stat_count,
    follower_count: profile.follower_count,
    view_count: profile.view_count,
    total_count: total,
  }));
}

async function fetchLeaderboardFallback(options: {
  tab: LeaderboardTab;
  period: LeaderboardPeriod;
  query: string;
  page: number;
  pageSize: number;
  skipTop: number;
  userId?: string;
}): Promise<LeaderboardResult> {
  const ranked = await buildRankedProfiles(options.tab, options.period, options.query);
  const total = ranked.length;
  const offset = options.skipTop + (options.page - 1) * options.pageSize;
  const slice = ranked.slice(offset, offset + options.pageSize);
  const rows = rankedToRows(slice, total);

  const following = options.userId
    ? await getFollowingSet(options.userId, rows.map((row) => row.profile_id))
    : new Set<string>();

  return mapRows(
    rows,
    options.tab,
    options.page,
    options.pageSize,
    options.period,
    options.query,
    following,
    options.skipTop,
  );
}

function isMissingRpcError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    message.includes("could not find the function") ||
    message.includes("does not exist")
  );
}

export async function fetchLeaderboard(options: {
  tab: LeaderboardTab;
  period?: LeaderboardPeriod;
  query?: string;
  page?: number;
  pageSize?: number;
  userId?: string;
  skipTop?: number;
}): Promise<LeaderboardResult> {
  const tab = options.tab;
  const period = options.period ?? "all";
  const query = sanitizeSearchQuery(options.query ?? "");
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? LEADERBOARD_PAGE_SIZE));
  const skipTop = Math.max(0, options.skipTop ?? 0);
  const offset = skipTop + (page - 1) * pageSize;
  const since = periodSince(period);

  const supabase = await db();
  const rpcName =
    tab === "views" ? "get_most_viewed_leaderboard" : "get_most_followed_leaderboard";

  const { data, error } = await supabase.rpc(rpcName, {
    p_since: since,
    p_search: query || null,
    p_limit: pageSize,
    p_offset: offset,
  });

  const rows = (data ?? []) as LeaderboardRow[];
  const rpcFailed = Boolean(error) || data == null;
  const rpcMissing = isMissingRpcError(error);

  if (rpcFailed || rpcMissing) {
    return fetchLeaderboardFallback({
      tab,
      period,
      query,
      page,
      pageSize,
      skipTop,
      userId: options.userId,
    });
  }

  if (rows.length === 0 && !query) {
    const profiles = await fetchProfiles();
    const eligible = profiles.filter((profile) =>
      tab === "views" ? !isFrozenViewCountProfile(profile) : true,
    );
    if (eligible.length > 0) {
      return fetchLeaderboardFallback({
        tab,
        period,
        query,
        page,
        pageSize,
        skipTop,
        userId: options.userId,
      });
    }
  }

  const profileIds = rows.map((row) => row.profile_id);
  const following = options.userId
    ? await getFollowingSet(options.userId, profileIds)
    : new Set<string>();

  return mapRows(rows, tab, page, pageSize, period, query, following, skipTop);
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
    query: sanitizeSearchQuery(query),
    page: 1,
    pageSize: 3,
    userId,
  });
  return result.entries;
}
