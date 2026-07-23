"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { countProfilePages } from "@/lib/data/profile-pages";
import { requireEntitlement } from "@/lib/premium/entitlements";
import { isValidPageSlug, normalizePageSlug } from "@/lib/profile-pages/slug";
import { DEFAULT_SETTINGS } from "@/lib/settings";

type ActionResult = { error?: string; success?: string; pageId?: string };

async function getUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

export async function createProfilePageAction(input: {
  slug: string;
  label: string;
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
      display_name: "",
      bio: "",
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
  });

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.username) {
    revalidatePath(`/${profile.username}/${slug}`);
    revalidatePath(`/${profile.username}`);
  }
  revalidatePath("/dashboard/profile-pages");

  return { success: "Profile page created.", pageId: page.id };
}

export async function renameProfilePageAction(
  pageId: string,
  input: { slug?: string; label?: string },
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const patch: Record<string, string> = {};

  if (input.slug) {
    const slug = normalizePageSlug(input.slug);
    if (!isValidPageSlug(slug)) return { error: "Invalid page slug." };
    patch.slug = slug;
  }
  if (input.label !== undefined) patch.label = input.label.trim();

  const { error } = await supabase
    .from("profile_pages")
    .update(patch)
    .eq("id", pageId)
    .eq("profile_id", userId);

  if (error) {
    if (error.code === "23505") return { error: "That page slug is already in use." };
    return { error: error.message };
  }

  revalidatePath("/dashboard/profile-pages");
  return { success: "Page updated." };
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

  revalidatePath("/dashboard/profile-pages");
  return { success: "Profile page deleted." };
}

export async function updateProfilePageIdentityAction(
  pageId: string,
  input: {
    label?: string;
    display_name?: string;
    bio?: string;
    avatar_url?: string | null;
    banner_url?: string | null;
  },
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "You must be logged in." };

  const gate = await requireEntitlement(userId, "can_use_multiple_profiles");
  if (!gate.ok) return { error: gate.error };

  const supabase = await createClient();
  const patch: Record<string, string | null> = {};

  if (input.label !== undefined) patch.label = input.label.trim();
  if (input.display_name !== undefined) patch.display_name = input.display_name.trim();
  if (input.bio !== undefined) {
    const bioError = await import("@/lib/moderation/validate").then((m) =>
      m.rejectIfModerated(input.bio ?? "", "bio", userId),
    );
    if (bioError) return { error: bioError };
    patch.bio = input.bio.trim();
  }
  if (input.avatar_url !== undefined) patch.avatar_url = input.avatar_url;
  if (input.banner_url !== undefined) patch.banner_url = input.banner_url;

  const { error } = await supabase
    .from("profile_pages")
    .update(patch)
    .eq("id", pageId)
    .eq("profile_id", userId);

  if (error) return { error: error.message };

  const { revalidateProfilePagePaths } = await import("@/lib/profile-pages/revalidate");
  await revalidateProfilePagePaths(userId, pageId);
  return { success: "Page identity saved." };
}
