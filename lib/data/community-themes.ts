import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  CommunityThemeCategory,
  CommunityThemeListing,
  CommunityThemeSort,
  CommunityThemesResult,
  CommunityThemeVisibility,
} from "@/lib/types/community-theme";
import { COMMUNITY_THEMES_PAGE_SIZE } from "@/lib/types/community-theme";

async function db() {
  return createAdminClient() ?? (await createClient());
}

function sanitizeSearchQuery(raw: string): string {
  return raw.trim().replace(/[%_,]/g, " ").slice(0, 64);
}

type ListingRow = {
  id: string;
  theme_id: string;
  author_id: string;
  title: string;
  description: string;
  tags: string[] | null;
  category: CommunityThemeCategory;
  visibility: CommunityThemeVisibility;
  preview_image_url: string | null;
  preview_style: string;
  like_count: number | null;
  install_count: number | null;
  is_staff_pick: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  }[] | null;
};

function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapListing(row: ListingRow, extras?: Partial<CommunityThemeListing>): CommunityThemeListing | null {
  const profile = unwrapJoin(row.profiles);
  if (!profile?.username) return null;

  return {
    id: row.id,
    theme_id: row.theme_id,
    author_id: row.author_id,
    title: row.title,
    description: row.description ?? "",
    tags: row.tags ?? [],
    category: row.category,
    visibility: row.visibility,
    preview_image_url: row.preview_image_url,
    preview_style: row.preview_style,
    like_count: Number(row.like_count) || 0,
    install_count: Number(row.install_count) || 0,
    is_staff_pick: row.is_staff_pick,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    creator_username: profile.username,
    creator_display_name: profile.display_name?.trim() || profile.username,
    creator_avatar_url: profile.avatar_url,
    ...extras,
  };
}

function sortColumn(sort: CommunityThemeSort): { column: string; ascending: boolean } {
  switch (sort) {
    case "most_installed":
      return { column: "install_count", ascending: false };
    case "most_liked":
      return { column: "like_count", ascending: false };
    case "recently_updated":
      return { column: "updated_at", ascending: false };
    case "newest":
      return { column: "published_at", ascending: false };
    case "trending":
    default:
      return { column: "install_count", ascending: false };
  }
}

export async function searchCommunityThemes(options: {
  query?: string;
  category?: string;
  sort?: CommunityThemeSort;
  page?: number;
  pageSize?: number;
  userId?: string;
  authorId?: string;
  staffPickOnly?: boolean;
  publishedSince?: string;
}): Promise<CommunityThemesResult> {
  const supabase = await db();
  const query = sanitizeSearchQuery(options.query ?? "");
  const category = options.category ?? "all";
  const sort = options.sort ?? "trending";
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, options.pageSize ?? COMMUNITY_THEMES_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { column, ascending } = sortColumn(sort);

  let request = supabase
    .from("community_theme_listings")
    .select(
      `
        id, theme_id, author_id, title, description, tags, category, visibility,
        preview_image_url, preview_style, like_count, install_count, is_staff_pick,
        published_at, created_at, updated_at,
        profiles:author_id (username, display_name, avatar_url)
      `,
      { count: "exact" },
    );

  if (options.authorId) {
    request = request.eq("author_id", options.authorId);
  } else {
    request = request.in("visibility", ["public", "open_source"]).not("published_at", "is", null);
  }

  if (options.staffPickOnly) {
    request = request.eq("is_staff_pick", true);
  }

  if (options.publishedSince) {
    request = request.gte("published_at", options.publishedSince);
  }

  if (category !== "all") {
    request = request.eq("category", category);
  }

  if (query) {
    const term = `%${query}%`;
    request = request.or(`title.ilike.${term},description.ilike.${term}`);
  }

  const { data, count, error } = await request.order(column, { ascending }).range(from, to);

  if (error) {
    return {
      themes: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      query,
      category,
      sort,
    };
  }

  const listingIds = (data ?? []).map((row) => row.id);
  const liked = new Set<string>();
  const installed = new Set<string>();

  if (options.userId && listingIds.length > 0) {
    const [likesRes, installsRes] = await Promise.all([
      supabase
        .from("community_theme_likes")
        .select("listing_id")
        .eq("user_id", options.userId)
        .in("listing_id", listingIds),
      supabase
        .from("community_theme_installs")
        .select("listing_id")
        .eq("installer_id", options.userId)
        .in("listing_id", listingIds),
    ]);

    for (const row of likesRes.data ?? []) liked.add(row.listing_id);
    for (const row of installsRes.data ?? []) installed.add(row.listing_id);
  }

  const themes = (data ?? [])
    .map((row) =>
      mapListing(row as ListingRow, {
        liked_by_me: liked.has(row.id),
        installed_by_me: installed.has(row.id),
      }),
    )
    .filter((theme): theme is CommunityThemeListing => theme !== null);

  const total = count ?? themes.length;
  return {
    themes,
    total,
    page,
    pageSize,
    totalPages: total > 0 ? Math.ceil(total / pageSize) : 0,
    query,
    category,
    sort,
  };
}

export async function getFeaturedCommunityThemeSections(userId?: string) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [trending, staffPicks, newReleases, weeklyInstalled] = await Promise.all([
    searchCommunityThemes({ sort: "trending", pageSize: 4, userId }),
    searchCommunityThemes({ sort: "most_liked", pageSize: 4, userId, staffPickOnly: true }),
    searchCommunityThemes({ sort: "newest", pageSize: 4, userId }),
    searchCommunityThemes({
      sort: "most_installed",
      pageSize: 4,
      userId,
      publishedSince: weekAgo,
    }),
  ]);

  return {
    trending: trending.themes,
    staffPicks: staffPicks.themes,
    newReleases: newReleases.themes,
    weeklyInstalled: weeklyInstalled.themes,
  };
}

export async function getMyPublishedThemes(userId: string): Promise<CommunityThemeListing[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("community_theme_listings")
    .select(
      `
        id, theme_id, author_id, title, description, tags, category, visibility,
        preview_image_url, preview_style, like_count, install_count, is_staff_pick,
        published_at, created_at, updated_at,
        profiles:author_id (username, display_name, avatar_url)
      `,
    )
    .eq("author_id", userId)
    .order("updated_at", { ascending: false });

  return (data ?? [])
    .map((row) => mapListing(row as ListingRow))
    .filter((theme): theme is CommunityThemeListing => theme !== null);
}

export async function getCommunityThemeListingById(
  listingId: string,
  userId?: string,
): Promise<CommunityThemeListing | null> {
  const supabase = await db();
  const { data } = await supabase
    .from("community_theme_listings")
    .select(
      `
        id, theme_id, author_id, title, description, tags, category, visibility,
        preview_image_url, preview_style, like_count, install_count, is_staff_pick,
        published_at, created_at, updated_at,
        profiles:author_id (username, display_name, avatar_url)
      `,
    )
    .eq("id", listingId)
    .maybeSingle();

  if (!data) return null;

  const listing = mapListing(data as ListingRow);
  if (!listing) return null;

  const isPublic = listing.visibility === "public" || listing.visibility === "open_source";
  if (!isPublic && listing.author_id !== userId) {
    return null;
  }

  if (userId) {
    const [likeRes, installRes] = await Promise.all([
      supabase
        .from("community_theme_likes")
        .select("listing_id")
        .eq("listing_id", listingId)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("community_theme_installs")
        .select("listing_id")
        .eq("listing_id", listingId)
        .eq("installer_id", userId)
        .maybeSingle(),
    ]);
    listing.liked_by_me = !!likeRes.data;
    listing.installed_by_me = !!installRes.data;
  }

  return listing;
}

export async function getListingForTheme(themeId: string, userId: string) {
  const supabase = await db();
  const { data } = await supabase
    .from("community_theme_listings")
    .select("id, visibility, title")
    .eq("theme_id", themeId)
    .eq("author_id", userId)
    .maybeSingle();
  return data;
}

export async function getThemePreviewCss(listingId: string, userId?: string): Promise<string | null> {
  const listing = await getCommunityThemeListingById(listingId, userId);
  if (!listing) return null;

  const supabase = createAdminClient() ?? (await createClient());
  const { data: theme } = await supabase
    .from("custom_themes")
    .select("css")
    .eq("id", listing.theme_id)
    .maybeSingle();

  return theme?.css ?? null;
}
