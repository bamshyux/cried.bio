"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { countProfilePages, getProfilePageById } from "@/lib/data/profile-pages";
import { requireEntitlement } from "@/lib/premium/entitlements";
import { isValidPageSlug, normalizePageSlug } from "@/lib/profile-pages/slug";
import { DEFAULT_SETTINGS } from "@/lib/settings";

type ActionResult = { error?: string; success?: string; pageId?: string };

const DASHBOARD_PAGES_PATH = "/dashboard/pages";

async function getUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

async function revalidateAllPagePaths(userId: string, pageId?: string) {
  revalidatePath(DASHBOARD_PAGES_PATH);
  if (pageId) {
    const { revalidateProfilePagePaths } = await import("@/lib/profile-pages/revalidate");
    await revalidateProfilePagePaths(userId, pageId);
  } else {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.username) {
      revalidatePath(`/${profile.username}`);
    }
  }
}

export async function createProfilePageAction(input: {
  slug: string;
  label: string;
  icon?: string;
}): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  const gate = await requireEntitlement(userId, "can_use_multiple_profiles");
  if (!gate.ok) return { error: gate.error };

  const slug = normalizePageSlug(input.slug);
  if (!isValidPageSlug(slug)) {
    return { error: "Invalid page slug. Use 1–30 lowercase letters, numbers, hyphens, or underscores." };
  }

  const count = await countProfilePages(userId);
  if (count >= gate.entitlements.max_profile_pages) {
    return { error: `Maximum ${gate.entitlements.max_profile_pages} additional pages allowed.` };
  }

  const supabase = await createClient();
  const { data: page, error } = await supabase
    .from("profile_pages")
    .insert({
      profile_id: userId,
      slug,
      label: input.label.trim() || slug,
      icon: input.icon?.trim() || "",
      published: true,
      sort_order: count,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "That page slug is already in use." };
    return { error: error.message };
  }

  await supabase.from("profile_settings").insert({
    profile_id: userId,
    page_id: page.id,
    layout: DEFAULT_SETTINGS.layout,
    accent_color: DEFAULT_SETTINGS.accent_color,
    text_color: DEFAULT_SETTINGS.text_color,
    background_color: DEFAULT_SETTINGS.background_color,
    font_family: DEFAULT_SETTINGS.font_family,
    enter_gate_enabled: false,
  });

  await revalidateAllPagePaths(userId, page.id);
  return { success: "Page created.", pageId: page.id };
}

export async function updateProfilePageAction(
  pageId: string,
  input: {
    slug?: string;
    label?: string;
    icon?: string;
    published?: boolean;
  },
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const patch: Record<string, string | boolean> = {};

  if (input.slug) {
    const slug = normalizePageSlug(input.slug);
    if (!isValidPageSlug(slug)) return { error: "Invalid page slug." };
    patch.slug = slug;
  }
  if (input.label !== undefined) patch.label = input.label.trim();
  if (input.icon !== undefined) patch.icon = input.icon.trim();
  if (input.published !== undefined) patch.published = input.published;

  const { error } = await supabase
    .from("profile_pages")
    .update(patch)
    .eq("id", pageId)
    .eq("profile_id", userId);

  if (error) {
    if (error.code === "23505") return { error: "That page slug is already in use." };
    return { error: error.message };
  }

  await revalidateAllPagePaths(userId, pageId);
  return { success: "Page updated." };
}

export async function renameProfilePageAction(
  pageId: string,
  input: { slug?: string; label?: string },
): Promise<ActionResult> {
  return updateProfilePageAction(pageId, input);
}

export async function deleteProfilePageAction(pageId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_pages")
    .delete()
    .eq("id", pageId)
    .eq("profile_id", userId);

  if (error) return { error: error.message };

  await revalidateAllPagePaths(userId);
  return { success: "Page deleted." };
}

export async function duplicateProfilePageAction(pageId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  const gate = await requireEntitlement(userId, "can_use_multiple_profiles");
  if (!gate.ok) return { error: gate.error };

  const count = await countProfilePages(userId);
  if (count >= gate.entitlements.max_profile_pages) {
    return { error: `Maximum ${gate.entitlements.max_profile_pages} additional pages allowed.` };
  }

  const page = await getProfilePageById(userId, pageId);
  if (!page) return { error: "Page not found." };

  const baseSlug = `${page.slug}-copy`;
  let slug = baseSlug.slice(0, 30);
  let suffix = 2;
  const supabase = await createClient();

  while (true) {
    const { data: existing } = await supabase
      .from("profile_pages")
      .select("id")
      .eq("profile_id", userId)
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug.slice(0, 26)}-${suffix}`;
    suffix++;
  }

  const { data: newPage, error } = await supabase
    .from("profile_pages")
    .insert({
      profile_id: userId,
      slug,
      label: `${page.label || page.slug} (copy)`,
      icon: page.icon,
      published: false,
      sort_order: count,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { data: sourceSettings } = await supabase
    .from("profile_settings")
    .select("*")
    .eq("profile_id", userId)
    .eq("page_id", pageId)
    .maybeSingle();

  if (sourceSettings) {
    const { id: _id, page_id: _pageId, created_at: _c, updated_at: _u, ...settingsCopy } = sourceSettings;
    await supabase.from("profile_settings").insert({
      ...settingsCopy,
      profile_id: userId,
      page_id: newPage.id,
      enter_gate_enabled: false,
    });
  }

  const { data: sourceLinks } = await supabase
    .from("links")
    .select("*")
    .eq("profile_id", userId)
    .eq("page_id", pageId);

  if (sourceLinks?.length) {
    await supabase.from("links").insert(
      sourceLinks.map(({ id: _id, page_id: _p, created_at: _c, updated_at: _u, ...link }) => ({
        ...link,
        profile_id: userId,
        page_id: newPage.id,
      })),
    );
  }

  await revalidateAllPagePaths(userId, newPage.id);
  return { success: "Page duplicated.", pageId: newPage.id };
}

export async function reorderProfilePagesAction(pageIds: string[]): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  const gate = await requireEntitlement(userId, "can_use_multiple_profiles");
  if (!gate.ok) return { error: gate.error };

  const supabase = await createClient();
  for (let i = 0; i < pageIds.length; i++) {
    await supabase
      .from("profile_pages")
      .update({ sort_order: i })
      .eq("id", pageIds[i])
      .eq("profile_id", userId);
  }

  await revalidateAllPagePaths(userId);
  return { success: "Page order saved." };
}

export async function toggleProfilePagePublishedAction(
  pageId: string,
  published: boolean,
): Promise<ActionResult> {
  return updateProfilePageAction(pageId, { published });
}
