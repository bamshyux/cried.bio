import { createClient } from "@/lib/supabase/server";
import type { ProfilePage } from "@/lib/profile-pages/slug";

export async function getProfilePages(profileId: string): Promise<ProfilePage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_pages")
    .select("*")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true });

  return ((data as ProfilePage[]) ?? []).map(normalizeProfilePage);
}

export async function getPublishedProfilePages(profileId: string): Promise<ProfilePage[]> {
  const { getUserEntitlements } = await import("@/lib/premium/entitlements");
  const entitlements = await getUserEntitlements(profileId);
  if (!entitlements.can_use_multiple_profiles) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_pages")
    .select("*")
    .eq("profile_id", profileId)
    .eq("published", true)
    .order("sort_order", { ascending: true });

  return ((data as ProfilePage[]) ?? []).map(normalizeProfilePage);
}

function normalizeProfilePage(page: ProfilePage): ProfilePage {
  return {
    ...page,
    icon: page.icon ?? "",
    bio: page.bio ?? "",
    published: page.published ?? true,
  };
}

export async function getProfilePageById(
  profileId: string,
  pageId: string,
): Promise<ProfilePage | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_pages")
    .select("*")
    .eq("profile_id", profileId)
    .eq("id", pageId)
    .maybeSingle();

  return (data as ProfilePage | null) ?? null;
}

export async function getProfilePageBySlug(
  profileId: string,
  slug: string,
): Promise<ProfilePage | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_pages")
    .select("*")
    .eq("profile_id", profileId)
    .eq("slug", slug)
    .maybeSingle();

  return (data as ProfilePage | null) ?? null;
}

export async function countProfilePages(profileId: string): Promise<number> {
  const pages = await getProfilePages(profileId);
  return pages.length;
}

export async function getSettingsByPageId(
  profileId: string,
  pageId: string,
): Promise<ReturnType<typeof import("@/lib/data/settings").getSettingsByProfileId>> {
  const supabase = await createClient();
  const { mergeSettings } = await import("@/lib/settings");
  const { ensureProfileSettingsRow } = await import("@/lib/data/ensure-profile-settings-row");

  let { data } = await supabase
    .from("profile_settings")
    .select("*")
    .eq("profile_id", profileId)
    .eq("page_id", pageId)
    .maybeSingle();

  if (!data) {
    const ensure = await ensureProfileSettingsRow(profileId, pageId);
    if (!ensure.error) {
      const { data: created } = await supabase
        .from("profile_settings")
        .select("*")
        .eq("profile_id", profileId)
        .eq("page_id", pageId)
        .maybeSingle();
      data = created;
    }
  }

  return mergeSettings(data, profileId);
}

export async function getLinksByPageId(profileId: string, pageId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("links")
    .select("*")
    .eq("profile_id", profileId)
    .eq("page_id", pageId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export async function getEmbedsByPageId(profileId: string, pageId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_embeds")
    .select("*")
    .eq("profile_id", profileId)
    .eq("page_id", pageId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export async function getFeaturedBlocksByPageId(profileId: string, pageId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("featured_blocks")
    .select("*")
    .eq("profile_id", profileId)
    .eq("page_id", pageId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}
