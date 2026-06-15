import { FOUNDER_BADGE_DESCRIPTION, FOUNDER_BADGE_SLUG, getFounderUserId } from "@/lib/badges/founder";
import { createClient } from "@/lib/supabase/server";
import type { Badge, BadgeInventoryItem, ProfileBadge } from "@/lib/types/badge";

type BadgeRow = {
  id: string;
  assigned_at: string;
  is_visible: boolean;
  is_featured: boolean;
  sort_order: number;
  award_source: string;
  badges: Badge | Badge[] | null;
};

function normalizeBadge(b: Record<string, unknown>): Badge {
  const slug = String(b.slug);
  const description =
    slug === FOUNDER_BADGE_SLUG
      ? FOUNDER_BADGE_DESCRIPTION
      : String(b.description ?? "");

  return {
    id: String(b.id),
    slug,
    name: String(b.name),
    icon: String(b.icon ?? b.slug),
    icon_url: b.icon_url ? String(b.icon_url) : null,
    color: String(b.color ?? "#00e5cc"),
    description,
    category: (b.category as Badge["category"]) ?? "custom",
    rarity: (b.rarity as Badge["rarity"]) ?? "common",
    sort_order: Number(b.sort_order ?? 0),
    is_system: Boolean(b.is_system ?? true),
    is_assignable: Boolean(b.is_assignable ?? true),
    award_rule: b.award_rule ? String(b.award_rule) : null,
    created_at: String(b.created_at ?? new Date().toISOString()),
  };
}

function mapProfileBadge(row: BadgeRow): ProfileBadge | null {
  const badge = row.badges;
  if (!badge || Array.isArray(badge)) return null;
  return {
    ...normalizeBadge(badge as Record<string, unknown>),
    profile_badge_id: row.id,
    assigned_at: row.assigned_at,
    is_visible: row.is_visible ?? true,
    is_featured: row.is_featured ?? false,
    sort_order: row.sort_order ?? 0,
    award_source: (row.award_source as ProfileBadge["award_source"]) ?? "manual",
  };
}

const BADGE_SELECT = `
  id, slug, name, icon, icon_url, color, description, category, rarity,
  sort_order, is_system, is_assignable, award_rule, created_at
`;

const PROFILE_BADGE_SELECT = `
  id, assigned_at, is_visible, is_featured, sort_order, award_source,
  badges (${BADGE_SELECT})
`;

export async function getBadgesByProfileId(profileId: string): Promise<ProfileBadge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_badges")
    .select(PROFILE_BADGE_SELECT)
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true })
    .order("assigned_at", { ascending: true });

  if (!data) return [];
  return data.map(mapProfileBadge).filter((b): b is ProfileBadge => b !== null);
}

export async function getAllBadgesCatalog(): Promise<Badge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("badges")
    .select(BADGE_SELECT)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) => normalizeBadge(row as Record<string, unknown>));
}

export async function getBadgeInventory(profileId: string): Promise<BadgeInventoryItem[]> {
  const [catalog, earned, founderId] = await Promise.all([
    getAllBadgesCatalog(),
    getBadgesByProfileId(profileId),
    getFounderUserId(),
  ]);

  const earnedMap = new Map(earned.map((b) => [b.id, b]));
  const showFounderBadge = founderId === profileId;

  return catalog
    .filter((badge) => showFounderBadge || badge.slug !== FOUNDER_BADGE_SLUG)
    .map((badge) => {
    const owned = earnedMap.get(badge.id);
    return {
      ...badge,
      earned: !!owned,
      profile_badge_id: owned?.profile_badge_id,
      assigned_at: owned?.assigned_at,
      is_visible: owned?.is_visible,
      is_featured: owned?.is_featured,
      user_sort_order: owned?.sort_order,
      award_source: owned?.award_source,
    };
  });
}

export async function getBadgeIdBySlug(slug: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("badges").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

export async function getBadgeIdsBySlugs(slugs: string[]): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("badges").select("id, slug").in("slug", slugs);
  const map = new Map<string, string>();
  for (const row of data ?? []) map.set(row.slug, row.id);
  return map;
}

export async function profileHasBadge(profileId: string, badgeId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_badges")
    .select("id")
    .eq("profile_id", profileId)
    .eq("badge_id", badgeId)
    .maybeSingle();
  return !!data;
}
