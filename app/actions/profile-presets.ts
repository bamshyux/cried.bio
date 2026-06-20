"use server";

import { revalidateUserProfile, getAuthenticatedUserId } from "@/lib/actions/auth";
import {
  applyProfilePresetSnapshot,
  captureProfilePresetSnapshot,
  resolvePresetThumbnailUrl,
} from "@/lib/profile-presets/snapshot";
import {
  getProfilePresetById,
  setActivePresetId,
} from "@/lib/data/profile-presets";
import { rejectIfModerated } from "@/lib/moderation/validate";
import type { ProfilePresetFormState } from "@/lib/types/profile-preset";
import { MAX_PROFILE_PRESETS } from "@/lib/types/profile-preset";
import { createClient } from "@/lib/supabase/server";

const REVALIDATE_PATHS = [
  "/dashboard/presets",
  "/dashboard/profile-presets",
  "/dashboard/customize",
  "/dashboard/background",
  "/dashboard/themes",
  "/dashboard/effects",
  "/dashboard/custom-theme",
  "/dashboard/links",
  "/dashboard/embeds",
  "/dashboard/widgets",
  "/dashboard/music",
  "/dashboard/badges",
  "/dashboard/featured",
  "/dashboard/profile",
];

async function revalidateAll(userId: string) {
  await revalidateUserProfile(userId, REVALIDATE_PATHS);
}

export async function saveCurrentProfilePresetAction(name: string): Promise<ProfilePresetFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const presetName = name.trim().slice(0, 60);
  if (!presetName) return { error: "Preset name is required." };

  const nameError = await rejectIfModerated(presetName, "theme_name", userId);
  if (nameError) return { error: nameError };

  const supabase = await createClient();
  const { count } = await supabase
    .from("profile_presets")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) >= MAX_PROFILE_PRESETS) {
    return { error: `Maximum ${MAX_PROFILE_PRESETS} presets allowed.` };
  }

  const presetData = await captureProfilePresetSnapshot(userId, { styleOnly: true });
  const thumbnailUrl = resolvePresetThumbnailUrl(presetData);

  const { data, error } = await supabase
    .from("profile_presets")
    .insert({
      user_id: userId,
      name: presetName,
      thumbnail_url: thumbnailUrl,
      preset_data: presetData,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await setActivePresetId(userId, data.id);
  await revalidateAll(userId);
  return { success: "Preset saved.", presetId: data.id };
}

export async function quickSaveActivePresetAction(): Promise<ProfilePresetFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("profile_settings")
    .select("active_preset_id")
    .eq("profile_id", userId)
    .maybeSingle();

  const activePresetId = settings?.active_preset_id;
  if (!activePresetId) {
    return { error: "No active preset. Save a preset from Profile Presets first." };
  }

  const presetData = await captureProfilePresetSnapshot(userId, { styleOnly: true });
  const thumbnailUrl = resolvePresetThumbnailUrl(presetData);

  const { error } = await supabase
    .from("profile_presets")
    .update({
      preset_data: presetData,
      thumbnail_url: thumbnailUrl,
    })
    .eq("id", activePresetId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  await revalidateAll(userId);
  return { success: "Active preset updated." };
}

export async function applyProfilePresetAction(presetId: string): Promise<ProfilePresetFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const preset = await getProfilePresetById(presetId, userId);
  if (!preset) return { error: "Preset not found." };

  const result = await applyProfilePresetSnapshot(userId, preset.preset_data);
  if (result.error) return { error: result.error };

  await setActivePresetId(userId, presetId);
  await revalidateAll(userId);
  return { success: `"${preset.name}" applied.` };
}

export async function renameProfilePresetAction(
  presetId: string,
  name: string,
): Promise<ProfilePresetFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const presetName = name.trim().slice(0, 60);
  if (!presetName) return { error: "Preset name is required." };

  const nameError = await rejectIfModerated(presetName, "theme_name", userId);
  if (nameError) return { error: nameError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_presets")
    .update({ name: presetName })
    .eq("id", presetId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  await revalidateAll(userId);
  return { success: "Preset renamed." };
}

export async function duplicateProfilePresetAction(
  presetId: string,
): Promise<ProfilePresetFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const preset = await getProfilePresetById(presetId, userId);
  if (!preset) return { error: "Preset not found." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("profile_presets")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) >= MAX_PROFILE_PRESETS) {
    return { error: `Maximum ${MAX_PROFILE_PRESETS} presets allowed.` };
  }

  const copyName = `${preset.name} (copy)`.slice(0, 60);
  const { data, error } = await supabase
    .from("profile_presets")
    .insert({
      user_id: userId,
      name: copyName,
      thumbnail_url: preset.thumbnail_url,
      preset_data: preset.preset_data,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await revalidateAll(userId);
  return { success: "Preset duplicated.", presetId: data.id };
}

export async function deleteProfilePresetAction(presetId: string): Promise<ProfilePresetFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("profile_settings")
    .select("active_preset_id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (settings?.active_preset_id === presetId) {
    await setActivePresetId(userId, null);
  }

  const { error } = await supabase
    .from("profile_presets")
    .delete()
    .eq("id", presetId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  await revalidateAll(userId);
  return { success: "Preset deleted." };
}

export async function exportProfilePresetAction(
  presetId: string,
): Promise<{ error?: string; json?: string; filename?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const preset = await getProfilePresetById(presetId, userId);
  if (!preset) return { error: "Preset not found." };

  const slug = preset.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return {
    json: JSON.stringify(preset.preset_data, null, 2),
    filename: `${slug || "profile-preset"}.json`,
  };
}

export async function updateProfilePresetSnapshotAction(
  presetId: string,
): Promise<ProfilePresetFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const preset = await getProfilePresetById(presetId, userId);
  if (!preset) return { error: "Preset not found." };

  const presetData = await captureProfilePresetSnapshot(userId, { styleOnly: true });
  const thumbnailUrl = resolvePresetThumbnailUrl(presetData);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_presets")
    .update({
      preset_data: presetData,
      thumbnail_url: thumbnailUrl,
    })
    .eq("id", presetId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  await revalidateAll(userId);
  return { success: `"${preset.name}" updated with your current profile.` };
}
