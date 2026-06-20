"use server";

import { applyCustomThemeAction } from "@/app/actions/custom-themes";
import { applyProfilePresetSnapshot, captureProfilePresetSnapshot } from "@/lib/profile-presets/snapshot";
import { setActivePresetId } from "@/lib/data/profile-presets";
import { revalidateUserProfile, getAuthenticatedUserId } from "@/lib/actions/auth";
import { getCommunityThemeListingById, isMissingPublishedPresetSnapshotColumn } from "@/lib/data/community-themes";
import { rejectIfModerated } from "@/lib/moderation/validate";
import { guardSensitiveAction } from "@/lib/security/guard-action";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCssInput } from "@/lib/themes/sanitize-css";
import type {
  CommunityThemeCategory,
  CommunityThemeFormState,
  CommunityThemeReportReason,
  CommunityThemeVisibility,
} from "@/lib/types/community-theme";
import { MAX_CUSTOM_THEMES } from "@/lib/types/custom-theme";
import { MAX_PROFILE_PRESETS } from "@/lib/types/profile-preset";
import type { ProfilePresetData } from "@/lib/types/profile-preset";
import { resolvePresetThumbnailUrl } from "@/lib/profile-presets/snapshot";
import { resolveCommunityPresetSnapshot } from "@/lib/profile-presets/community-snapshot";
import { parsePresetData } from "@/lib/profile-presets/snapshot";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const REVALIDATE_PATHS = [
  "/dashboard/explore",
  "/dashboard/explore/themes",
  "/dashboard/custom-theme",
  "/dashboard/profile-presets",
  "/dashboard/presets",
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

  const guardError = await guardSensitiveAction({ scope: "theme_publish", userId });
  if (guardError) return { error: guardError };

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
    listing_type: "theme" as const,
    theme_id: input.themeId,
    profile_preset_id: null,
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

export async function publishCommunityProfilePresetAction(input: {
  presetId: string;
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

  const guardError = await guardSensitiveAction({ scope: "theme_publish", userId });
  if (guardError) return { error: guardError };

  const title = input.title.trim().slice(0, 80);
  const description = input.description.trim().slice(0, 500);
  if (!title) return { error: "Preset name is required." };

  const titleError = await rejectIfModerated(title, "theme_name", userId);
  if (titleError) return { error: titleError };

  const descError = await rejectIfModerated(description, "bio", userId);
  if (descError) return { error: descError };

  const supabase = await createClient();
  const { data: preset } = await supabase
    .from("profile_presets")
    .select("id, thumbnail_url")
    .eq("id", input.presetId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!preset) return { error: "Preset not found." };

  const presetData = await captureProfilePresetSnapshot(userId, { styleOnly: true });

  const visibility = input.visibility === "open_source" ? "public" : input.visibility;
  const thumbnail =
    input.previewImageUrl?.trim() ||
    preset.thumbnail_url ||
    resolvePresetThumbnailUrl(presetData);

  const payload = {
    listing_type: "profile_preset" as const,
    theme_id: null,
    profile_preset_id: input.presetId,
    published_preset_data: presetData,
    author_id: userId,
    title,
    description,
    tags: parseTags(input.tags),
    category: input.category,
    visibility,
    preview_image_url: thumbnail || null,
    preview_style:
      input.previewStyle?.trim() ||
      "linear-gradient(135deg, #1a1a1a 0%, #333 50%, #111 100%)",
    published_at: publishedAtForVisibility(visibility),
  };

  const { data: existing } = await supabase
    .from("community_theme_listings")
    .select("id")
    .eq("profile_preset_id", input.presetId)
    .maybeSingle();

  let listingId: string;

  if (existing?.id) {
    let { error } = await supabase
      .from("community_theme_listings")
      .update(payload)
      .eq("id", existing.id)
      .eq("author_id", userId);
    if (error && isMissingPublishedPresetSnapshotColumn(error)) {
      const { published_preset_data: _snapshot, ...payloadWithoutSnapshot } = payload;
      ({ error } = await supabase
        .from("community_theme_listings")
        .update(payloadWithoutSnapshot)
        .eq("id", existing.id)
        .eq("author_id", userId));
    }
    if (error) return { error: error.message };
    listingId = existing.id;
  } else {
    let { data, error } = await supabase
      .from("community_theme_listings")
      .insert(payload)
      .select("id")
      .single();
    if (error && isMissingPublishedPresetSnapshotColumn(error)) {
      const { published_preset_data: _snapshot, ...payloadWithoutSnapshot } = payload;
      ({ data, error } = await supabase
        .from("community_theme_listings")
        .insert(payloadWithoutSnapshot)
        .select("id")
        .single());
    }
    if (error) return { error: error.message };
    if (!data) return { error: "Failed to publish preset." };
    listingId = data.id;
  }

  await revalidateCommunity(userId);
  return {
    success:
      visibility === "private"
        ? "Preset saved as private."
        : "Preset published to Community Themes.",
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

  if (listing.listing_type === "profile_preset") {
    return installCommunityProfilePresetListing(listing, userId, applyAfter);
  }

  if (!listing.theme_id) return { error: "Theme source not found." };

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

async function installCommunityProfilePresetListing(
  listing: Awaited<ReturnType<typeof getCommunityThemeListingById>> & {
    profile_preset_id: string | null;
    published_preset_data?: ProfilePresetData | null;
  },
  userId: string,
  applyAfter: boolean,
): Promise<CommunityThemeFormState> {
  const admin = createAdminClient();
  const client = admin ?? (await createClient());

  let fallbackPresetData: unknown = null;
  if (listing.profile_preset_id) {
    const { data: sourcePreset } = await client
      .from("profile_presets")
      .select("preset_data, thumbnail_url")
      .eq("id", listing.profile_preset_id)
      .maybeSingle();
    fallbackPresetData = sourcePreset?.preset_data ?? null;
  }

  const snapshot = resolveCommunityPresetSnapshot(
    listing.published_preset_data,
    fallbackPresetData,
  );
  if (!snapshot) return { error: "Preset source not found." };

  if (listing.author_id === userId) {
    const applyResult = await applyProfilePresetSnapshot(userId, snapshot);
    if (applyResult.error) return { error: applyResult.error };
    if (listing.profile_preset_id) {
      await setActivePresetId(userId, listing.profile_preset_id);
    }
    await revalidateCommunity(userId);
    return { success: "Preset applied to your profile." };
  }

  const { data: existingInstall } = await client
    .from("community_theme_installs")
    .select("installed_preset_id")
    .eq("listing_id", listing.id)
    .eq("installer_id", userId)
    .maybeSingle();

  if (existingInstall?.installed_preset_id) {
    if (applyAfter) {
      const { data: installedPreset } = await client
        .from("profile_presets")
        .select("preset_data")
        .eq("id", existingInstall.installed_preset_id)
        .maybeSingle();

      const installedSnapshot = resolveCommunityPresetSnapshot(
        listing.published_preset_data,
        installedPreset?.preset_data ?? snapshot,
      );
      if (!installedSnapshot) return { error: "Preset source not found." };

      const result = await applyProfilePresetSnapshot(userId, installedSnapshot, {
        preservePersonalContent: true,
      });
      if (result.error) return { error: result.error };
      await setActivePresetId(userId, existingInstall.installed_preset_id);
    }
    return {
      success: "Preset already in your library.",
      presetId: existingInstall.installed_preset_id,
    };
  }

  const { count } = await client
    .from("profile_presets")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) >= MAX_PROFILE_PRESETS) {
    return { error: `Maximum ${MAX_PROFILE_PRESETS} presets allowed.` };
  }

  const copyName = `${listing.title}`.slice(0, 60);
  const nameError = await rejectIfModerated(copyName, "theme_name", userId);
  if (nameError) return { error: nameError };

  const { data: installedPreset, error: insertError } = await client
    .from("profile_presets")
    .insert({
      user_id: userId,
      name: copyName,
      thumbnail_url: listing.preview_image_url ?? resolvePresetThumbnailUrl(snapshot) ?? null,
      preset_data: snapshot,
    })
    .select("id")
    .single();

  if (insertError || !installedPreset) {
    return { error: insertError?.message ?? "Failed to copy preset." };
  }

  const { error: installError } = await client.from("community_theme_installs").insert({
    listing_id: listing.id,
    installer_id: userId,
    installed_preset_id: installedPreset.id,
  });

  if (installError) return { error: installError.message };

  if (applyAfter) {
    const applyResult = await applyProfilePresetSnapshot(userId, snapshot, {
      preservePersonalContent: true,
    });
    if (applyResult.error) {
      return {
        success: "Preset saved to your library, but could not apply automatically.",
        presetId: installedPreset.id,
      };
    }
    await setActivePresetId(userId, installedPreset.id);
  }

  await revalidateCommunity(userId);
  return {
    success: applyAfter
      ? "Preset installed and applied to your profile."
      : "Preset installed to your library.",
    presetId: installedPreset.id,
  };
}

export async function cloneCommunityThemeAction(listingId: string): Promise<CommunityThemeFormState> {
  const listing = await getCommunityThemeListingById(listingId);
  if (!listing || listing.visibility !== "open_source" || listing.listing_type !== "theme") {
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
  presetData?: unknown;
  presetName?: string;
  listingType?: "theme" | "profile_preset";
  error?: string;
}> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { css: null, error: "Unauthorized" };

  const listing = await getCommunityThemeListingById(listingId, userId);
  if (!listing) return { css: null, error: "Preview unavailable." };

  if (listing.listing_type === "profile_preset") {
    const { getPresetPreviewData } = await import("@/lib/data/community-themes");
    const preset = await getPresetPreviewData(listingId, userId);
    if (!preset) return { css: null, error: "Preview unavailable." };
    return {
      css: null,
      presetData: preset.preset_data,
      presetName: preset.name,
      listingType: "profile_preset",
    };
  }

  const { getThemePreviewCss } = await import("@/lib/data/community-themes");
  const css = await getThemePreviewCss(listingId, userId);
  if (!css) return { css: null, error: "Preview unavailable." };
  return { css, listingType: "theme" };
}
