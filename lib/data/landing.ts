import {
  DEFAULT_ROADMAP,
  DEFAULT_TESTIMONIALS,
  DEFAULT_THEME_PREVIEWS,
} from "@/lib/landing/defaults";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  LandingActivityItem,
  LandingFeaturedProfile,
  LandingFeaturedProfileRow,
  LandingProfile,
  LandingRoadmapItem,
  LandingStats,
  LandingTestimonial,
  LandingThemePreview,
} from "@/lib/types/landing";

async function db() {
  return createAdminClient() ?? (await createClient());
}

/** Supabase FK joins may return a single row or a one-element array depending on inference. */
function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** UID #1 (founder) view count is excluded from public landing totals. */
const LANDING_EXCLUDED_VIEW_UID = 1;

async function sumPublicProfileViews(
  supabase: Awaited<ReturnType<typeof db>>,
): Promise<number> {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("view_count, uid")
    .not("username", "is", null);

  const fromViewCounts = (profiles ?? [])
    .filter((row) => row.uid !== LANDING_EXCLUDED_VIEW_UID)
    .reduce((sum, row) => sum + (Number(row.view_count) || 0), 0);

  if (fromViewCounts > 0) return fromViewCounts;

  const { data: founderRow } = await supabase
    .from("profiles")
    .select("id")
    .eq("uid", LANDING_EXCLUDED_VIEW_UID)
    .maybeSingle();

  let query = supabase
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "profile_view");

  if (founderRow?.id) {
    query = query.neq("profile_id", founderRow.id);
  }

  const { count } = await query;
  return count ?? 0;
}

function mapProfile(row: {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}): LandingProfile | null {
  if (!row.username) return null;
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name?.trim() || row.username,
    avatar_url: row.avatar_url,
    bio: row.bio?.trim() || "",
  };
}

export async function getLandingStats(): Promise<LandingStats> {
  const supabase = await db();

  const { data: rpcData } = await supabase.rpc("public_platform_stats");
  if (rpcData && typeof rpcData === "object") {
    const stats = rpcData as Record<string, number>;
    return {
      total_users: Number(stats.total_users) || 0,
      total_profiles: Number(stats.total_profiles) || 0,
      total_profile_views: Number(stats.total_profile_views) || 0,
      total_guestbook_posts: Number(stats.total_guestbook_posts) || 0,
      total_custom_themes: Number(stats.total_custom_themes) || 0,
      total_badges_granted: Number(stats.total_badges_granted) || 0,
    };
  }

  const [
    users,
    profiles,
    guestbook,
    themes,
    badges,
    totalProfileViews,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).not("username", "is", null),
    supabase.from("guestbook_entries").select("*", { count: "exact", head: true }),
    supabase.from("custom_themes").select("*", { count: "exact", head: true }),
    supabase.from("profile_badges").select("*", { count: "exact", head: true }),
    sumPublicProfileViews(supabase),
  ]);

  return {
    total_users: users.count ?? 0,
    total_profiles: profiles.count ?? 0,
    total_profile_views: totalProfileViews,
    total_guestbook_posts: guestbook.count ?? 0,
    total_custom_themes: themes.count ?? 0,
    total_badges_granted: badges.count ?? 0,
  };
}

export async function getRandomPublicProfiles(limit = 12): Promise<LandingProfile[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .not("username", "is", null)
    .order("created_at", { ascending: false })
    .limit(Math.max(limit * 4, 40));

  const mapped = (data ?? [])
    .map((row) => mapProfile(row))
    .filter((p): p is LandingProfile => p !== null);

  return shuffle(mapped).slice(0, limit);
}

export async function getFeaturedProfiles(): Promise<LandingFeaturedProfile[]> {
  const supabase = await db();

  const { data: featured, error } = await supabase
    .from("landing_featured_profiles")
    .select("sort_order, profiles:profile_id (id, username, display_name, avatar_url, bio)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(8);

  if (!error && featured?.length) {
    const result: LandingFeaturedProfile[] = [];
    for (const row of featured) {
      const profile = unwrapJoin(
        row.profiles as
          | {
              id: string;
              username: string | null;
              display_name: string | null;
              avatar_url: string | null;
              bio: string | null;
            }
          | {
              id: string;
              username: string | null;
              display_name: string | null;
              avatar_url: string | null;
              bio: string | null;
            }[]
          | null,
      );
      const mapped = profile ? mapProfile(profile) : null;
      if (mapped) {
        result.push({ ...mapped, sort_order: row.sort_order });
      }
    }
    if (result.length) return result;
  }

  const fallback = await getRandomPublicProfiles(6);
  return fallback.map((p, i) => ({ ...p, sort_order: i }));
}

export async function getLandingActivityFeed(limit = 20): Promise<LandingActivityItem[]> {
  const supabase = await db();
  const items: LandingActivityItem[] = [];

  const [events, newProfiles, themes, badgeAwards] = await Promise.all([
    supabase
      .from("activity_events")
      .select("id, event_type, title, created_at, profiles:profile_id (username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("profiles")
      .select("id, username, avatar_url, created_at")
      .not("username", "is", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("custom_themes")
      .select("id, name, created_at, profiles:profile_id (username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("profile_badges")
      .select("id, assigned_at, profiles:profile_id (username, avatar_url), badges:badge_id (name)")
      .order("assigned_at", { ascending: false })
      .limit(8),
  ]);

  for (const row of events.data ?? []) {
    const profile = unwrapJoin(row.profiles);
    items.push({
      id: `event-${row.id}`,
      type: row.event_type as LandingActivityItem["type"],
      title: row.title,
      username: profile?.username ?? null,
      avatar_url: profile?.avatar_url ?? null,
      created_at: row.created_at,
    });
  }

  for (const row of newProfiles.data ?? []) {
    if (!row.username) continue;
    items.push({
      id: `signup-${row.id}`,
      type: "profile_created",
      title: `@${row.username} joined cried.bio`,
      username: row.username,
      avatar_url: row.avatar_url,
      created_at: row.created_at,
    });
  }

  for (const row of themes.data ?? []) {
    const profile = unwrapJoin(row.profiles);
    items.push({
      id: `theme-${row.id}`,
      type: "theme_created",
      title: `Created theme "${row.name}"`,
      username: profile?.username ?? null,
      avatar_url: profile?.avatar_url ?? null,
      created_at: row.created_at,
    });
  }

  for (const row of badgeAwards.data ?? []) {
    const profile = unwrapJoin(row.profiles);
    const badge = unwrapJoin(row.badges);
    items.push({
      id: `badge-${row.id}`,
      type: "badge_earned",
      title: `Earned the ${badge?.name ?? "badge"} badge`,
      username: profile?.username ?? null,
      avatar_url: profile?.avatar_url ?? null,
      created_at: row.assigned_at,
    });
  }

  return items
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export async function getLandingTestimonials(): Promise<LandingTestimonial[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("landing_testimonials")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!error && data?.length) {
    return data as LandingTestimonial[];
  }

  return DEFAULT_TESTIMONIALS.map((item, i) => ({
    ...item,
    id: `default-${i}`,
  }));
}

export async function getLandingRoadmap(): Promise<LandingRoadmapItem[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("landing_roadmap_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!error && data?.length) {
    return data as LandingRoadmapItem[];
  }

  return DEFAULT_ROADMAP.map((item, i) => ({
    ...item,
    id: `default-${i}`,
  }));
}

export async function getThemeMarketplacePreview(): Promise<LandingThemePreview[]> {
  const supabase = await db();

  const { data: curated, error } = await supabase
    .from("landing_theme_previews")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(6);

  if (!error && curated?.length) {
    return curated as LandingThemePreview[];
  }

  const { data: themes } = await supabase
    .from("custom_themes")
    .select("name")
    .limit(200);

  if (themes?.length) {
    const counts = new Map<string, number>();
    for (const row of themes) {
      counts.set(row.name, (counts.get(row.name) ?? 0) + 1);
    }
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count], i) => ({
        id: `live-${i}`,
        name,
        description: "Community-created custom theme",
        preview_style: DEFAULT_THEME_PREVIEWS[i % DEFAULT_THEME_PREVIEWS.length].preview_style,
        install_count: count,
      }));
    if (top.length) return top;
  }

  return DEFAULT_THEME_PREVIEWS.map((item, i) => ({
    ...item,
    id: `default-${i}`,
  }));
}

export async function getFloatingProfileCards(limit = 8): Promise<LandingProfile[]> {
  return getRandomPublicProfiles(limit);
}

// ─── Admin helpers ───

export async function listLandingFeaturedProfiles(): Promise<LandingFeaturedProfileRow[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("landing_featured_profiles")
    .select("id, sort_order, is_active, profile_id, profiles:profile_id (username, display_name)")
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    sort_order: row.sort_order,
    is_active: row.is_active,
    profile_id: row.profile_id,
    profiles: unwrapJoin(row.profiles),
  }));
}

export async function listLandingTestimonialsAdmin() {
  const supabase = await db();
  const { data } = await supabase
    .from("landing_testimonials")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as LandingTestimonial[];
}

export async function listLandingRoadmapAdmin() {
  const supabase = await db();
  const { data } = await supabase
    .from("landing_roadmap_items")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as LandingRoadmapItem[];
}

export async function listLandingThemePreviewsAdmin() {
  const supabase = await db();
  const { data } = await supabase
    .from("landing_theme_previews")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as LandingThemePreview[];
}
