import { getFollowing } from "@/lib/data/social";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  ExploreProfile,
  ExploreProfilesResult,
  SuggestedExploreProfile,
  SuggestedProfileReason,
} from "@/lib/types/explore-profiles";

export const EXPLORE_PROFILES_PAGE_SIZE = 12;
export const EXPLORE_SUGGESTED_LIMIT = 8;

async function db() {
  return createAdminClient() ?? (await createClient());
}

function sanitizeSearchQuery(raw: string): string {
  return raw.trim().replace(/[%_,]/g, " ").slice(0, 64);
}

function mapExploreProfile(row: {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  view_count?: number | null;
  created_at?: string | null;
  premium_tier?: string | null;
}): ExploreProfile | null {
  if (!row.username) return null;

  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name?.trim() || row.username,
    avatar_url: row.avatar_url,
    bio: row.bio?.trim() || "",
    view_count: Number(row.view_count) || 0,
    created_at: row.created_at ?? new Date(0).toISOString(),
    premium_tier: row.premium_tier === "premium" ? "premium" : "free",
  };
}

function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function searchExploreProfiles(options: {
  query?: string;
  page?: number;
  pageSize?: number;
  excludeUserId?: string;
}): Promise<ExploreProfilesResult> {
  const supabase = await db();
  const query = sanitizeSearchQuery(options.query ?? "");
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, options.pageSize ?? EXPLORE_PROFILES_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let request = supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, bio, view_count, created_at, premium_tier",
      { count: "exact" },
    )
    .not("username", "is", null);

  if (options.excludeUserId) {
    request = request.neq("id", options.excludeUserId);
  }

  if (query) {
    const term = `%${query}%`;
    request = request.or(
      `username.ilike.${term},display_name.ilike.${term},bio.ilike.${term}`,
    );
  }

  const { data, count, error } = await request
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return {
      profiles: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      query,
    };
  }

  const profiles = (data ?? [])
    .map((row) => mapExploreProfile(row))
    .filter((profile): profile is ExploreProfile => profile !== null);

  const total = count ?? profiles.length;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

  return {
    profiles,
    total,
    page,
    pageSize,
    totalPages,
    query,
  };
}

function addSuggestion(
  bucket: Map<string, SuggestedExploreProfile>,
  profile: ExploreProfile | null,
  reason: SuggestedProfileReason,
) {
  if (!profile || bucket.has(profile.id)) return;
  bucket.set(profile.id, { ...profile, reason });
}

export async function getSuggestedExploreProfiles(
  userId: string,
  limit = EXPLORE_SUGGESTED_LIMIT,
): Promise<SuggestedExploreProfile[]> {
  const supabase = await db();
  const bucket = new Map<string, SuggestedExploreProfile>();

  const { data: featuredRows } = await supabase
    .from("landing_featured_profiles")
    .select(
      "sort_order, profiles:profile_id (id, username, display_name, avatar_url, bio, view_count, created_at, premium_tier)",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(limit);

  for (const row of featuredRows ?? []) {
    const profileRow = unwrapJoin(row.profiles);
    if (!profileRow || profileRow.id === userId) continue;
    addSuggestion(bucket, mapExploreProfile(profileRow), "featured");
  }

  const following = await getFollowing(userId, 6);
  const networkCandidateIds = new Set<string>();
  for (const person of following) {
    if (!person?.id || person.id === userId) continue;
    const network = await getFollowing(person.id, 4);
    for (const candidate of network) {
      if (!candidate?.id || candidate.id === userId) continue;
      networkCandidateIds.add(candidate.id);
    }
  }

  if (networkCandidateIds.size > 0) {
    const { data: networkProfiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, view_count, created_at, premium_tier")
      .in("id", [...networkCandidateIds])
      .not("username", "is", null);

    for (const row of networkProfiles ?? []) {
      addSuggestion(bucket, mapExploreProfile(row), "network");
    }
  }

  const { data: popularRows } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, view_count, created_at, premium_tier")
    .not("username", "is", null)
    .neq("id", userId)
    .order("view_count", { ascending: false })
    .limit(limit);

  for (const row of popularRows ?? []) {
    addSuggestion(bucket, mapExploreProfile(row), "popular");
  }

  const { data: recentRows } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, view_count, created_at, premium_tier")
    .not("username", "is", null)
    .neq("id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  for (const row of recentRows ?? []) {
    addSuggestion(bucket, mapExploreProfile(row), "recent");
  }

  const priority: Record<SuggestedProfileReason, number> = {
    featured: 0,
    network: 1,
    popular: 2,
    recent: 3,
  };

  return [...bucket.values()]
    .sort((a, b) => priority[a.reason] - priority[b.reason])
    .slice(0, limit);
}
