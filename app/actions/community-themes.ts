"use server";

import { applyCustomThemeAction } from "@/app/actions/custom-themes";
import { revalidateUserProfile, getAuthenticatedUserId } from "@/lib/actions/auth";
import { getCommunityThemeListingById } from "@/lib/data/community-themes";
import { rejectIfModerated } from "@/lib/moderation/validate";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCssInput } from "@/lib/themes/sanitize-css";
import type {
  CommunityThemeCategory,
  CommunityThemeFormState,
  CommunityThemeReportReason,
  CommunityThemeVisibility,
} from "@/lib/types/community-theme";
import { MAX_CUSTOM_THEMES } from "@/lib/types/custom-theme";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const REVALIDATE_PATHS = [
  "/dashboard/explore",
  "/dashboard/explore/themes",
  "/dashboard/custom-theme",
];

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim().slice(0, 24))
    .filter(Boolean)
    .slice(0, 8);
}

function publishedAtForVisibility(visibility: CommunityThemeVisibility): string | null {
  return visibility === "private" ? null : new Date().toISOString();
}

async function revalidateCommunity(userId: string) {
  await revalidateUserProfile(userId, REVALIDATE_PATHS);
  revalidatePath("/dashboard/explore/themes");
}

export async function publishCommunityThemeAction(input: {
  themeId: string;
  title: string;
  description: string;
  tags: string;
  category: CommunityThemeCategory;
  visibility: CommunityThemeVisibility;
  previewImageUrl?: string;
  previewStyle?: string;
}): Promise<CommunityThemeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const title = input.title.trim().slice(0, 80);
  const description = input.description.trim().slice(0, 500);
  if (!title) return { error: "Theme name is required." };

  const titleError = await rejectIfModerated(title, "theme_name", userId);
  if (titleError) return { error: titleError };

  const descError = await rejectIfModerated(description, "bio", userId);
  if (descError) return { error: descError };

  const supabase = await createClient();
  const { data: theme } = await supabase
    .from("custom_themes")
    .select("id, css")
    .eq("id", input.themeId)
    .eq("profile_id", userId)
    .maybeSingle();

  if (!theme) return { error: "Theme not found." };

  const cssCheck = validateCssInput(theme.css);
  if (!cssCheck.ok) return { error: cssCheck.error };

  const payload = {
    theme_id: input.themeId,
    author_id: userId,
    title,
    description,
    tags: parseTags(input.tags),
    category: input.category,
    visibility: input.visibility,
    preview_image_url: input.previewImageUrl?.trim() || null,
    preview_style:
      input.previewStyle?.trim() ||
      "linear-gradient(135deg, #1a1a1a 0%, #333 50%, #111 100%)",
    published_at: publishedAtForVisibility(input.visibility),
  };

  const { data: existing } = await supabase
    .from("community_theme_listings")
    .select("id")
    .eq("theme_id", input.themeId)
    .maybeSingle();

  let listingId: string;

  if (existing?.id) {
    const { error } = await supabase
      .from("community_theme_listings")
      .update(payload)
      .eq("id", existing.id)
      .eq("author_id", userId);
    if (error) return { error: error.message };
    listingId = existing.id;
  } else {
    const { data, error } = await supabase
      .from("community_theme_listings")
      .insert(payload)
      .select("id")
      .single();
    if (error) return { error: error.message };
    listingId = data.id;
  }

  await revalidateCommunity(userId);
  return {
    success:
      input.visibility === "private"
        ? "Theme saved as private."
        : "Theme published to Community Themes.",
    listingId,
  };
}

export async function unpublishCommunityThemeAction(listingId: string): Promise<CommunityThemeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("community_theme_listings")
    .update({ visibility: "private", published_at: null })
    .eq("id", listingId)
    .eq("author_id", userId);

  if (error) return { error: error.message };
  await revalidateCommunity(userId);
  return { success: "Theme unpublished." };
}

export async function deleteCommunityThemeListingAction(
  listingId: string,
): Promise<CommunityThemeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("community_theme_listings")
    .delete()
    .eq("id", listingId)
    .eq("author_id", userId);

  if (error) return { error: error.message };
  await revalidateCommunity(userId);
  return { success: "Published theme removed." };
}

export async function installCommunityThemeAction(
  listingId: string,
  applyAfter = true,
): Promise<CommunityThemeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const listing = await getCommunityThemeListingById(listingId, userId);
  if (!listing || (listing.visibility !== "public" && listing.visibility !== "open_source")) {
    return { error: "Theme is not available to install." };
  }

  if (listing.author_id === userId) {
    const applyResult = await applyCustomThemeAction(listing.theme_id);
    return applyResult.error
      ? { error: applyResult.error }
      : { success: "Your theme is already in your library. Applied to profile." };
  }

  const admin = createAdminClient();
  const client = admin ?? (await createClient());

  const { data: existingInstall } = await client
    .from("community_theme_installs")
    .select("installed_theme_id")
    .eq("listing_id", listingId)
    .eq("installer_id", userId)
    .maybeSingle();

  if (existingInstall?.installed_theme_id) {
    if (applyAfter) {
      const applyResult = await applyCustomThemeAction(existingInstall.installed_theme_id);
      if (applyResult.error) return { error: applyResult.error };
    }
    return { success: "Theme already in your library.", installedThemeId: existingInstall.installed_theme_id };
  }

  const { data: sourceTheme } = await client
    .from("custom_themes")
    .select("css")
    .eq("id", listing.theme_id)
    .maybeSingle();

  if (!sourceTheme?.css) return { error: "Theme source not found." };

  const { count } = await client
    .from("custom_themes")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", userId);

  if ((count ?? 0) >= MAX_CUSTOM_THEMES) {
    return { error: `Maximum ${MAX_CUSTOM_THEMES} custom themes allowed.` };
  }

  const copyName = `${listing.title}`.slice(0, 60);
  const nameError = await rejectIfModerated(copyName, "theme_name", userId);
  if (nameError) return { error: nameError };

  const { data: installedTheme, error: insertError } = await client
    .from("custom_themes")
    .insert({
      profile_id: userId,
      name: copyName,
      css: sourceTheme.css,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();

  if (insertError || !installedTheme) {
    return { error: insertError?.message ?? "Failed to copy theme." };
  }

  const { error: installError } = await client.from("community_theme_installs").insert({
    listing_id: listingId,
    installer_id: userId,
    installed_theme_id: installedTheme.id,
  });

  if (installError) return { error: installError.message };

  if (applyAfter) {
    const applyResult = await applyCustomThemeAction(installedTheme.id);
    if (applyResult.error) {
      return {
        success: "Theme installed to your library, but could not apply automatically.",
        installedThemeId: installedTheme.id,
      };
    }
  }

  await revalidateCommunity(userId);
  return {
    success: applyAfter ? "Theme installed and applied to your profile." : "Theme installed to your library.",
    installedThemeId: installedTheme.id,
  };
}

export async function cloneCommunityThemeAction(listingId: string): Promise<CommunityThemeFormState> {
  const listing = await getCommunityThemeListingById(listingId);
  if (!listing || listing.visibility !== "open_source") {
    return { error: "Only open source themes can be cloned." };
  }
  return installCommunityThemeAction(listingId, false);
}

export async function toggleCommunityThemeLikeAction(
  listingId: string,
): Promise<CommunityThemeFormState & { liked?: boolean }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("community_theme_likes")
    .select("listing_id")
    .eq("listing_id", listingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("community_theme_likes")
      .delete()
      .eq("listing_id", listingId)
      .eq("user_id", userId);
    if (error) return { error: error.message };
    await revalidateCommunity(userId);
    return { success: "Like removed.", liked: false };
  }

  const { error } = await supabase.from("community_theme_likes").insert({
    listing_id: listingId,
    user_id: userId,
  });

  if (error) return { error: error.message };
  await revalidateCommunity(userId);
  return { success: "Theme liked.", liked: true };
}

export async function reportCommunityThemeAction(input: {
  listingId: string;
  reason: CommunityThemeReportReason;
  details?: string;
}): Promise<CommunityThemeFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { error } = await supabase.from("community_theme_reports").insert({
    listing_id: input.listingId,
    reporter_id: userId,
    reason: input.reason,
    details: (input.details ?? "").trim().slice(0, 500),
  });

  if (error) {
    if (error.code === "23505") return { error: "You already reported this theme." };
    return { error: error.message };
  }

  return { success: "Report submitted. Thank you." };
}

export async function getCommunityThemePreviewAction(listingId: string): Promise<{
  css: string | null;
  error?: string;
}> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { css: null, error: "Unauthorized" };

  const { getThemePreviewCss } = await import("@/lib/data/community-themes");
  const css = await getThemePreviewCss(listingId, userId);
  if (!css) return { css: null, error: "Preview unavailable." };
  return { css };
}
