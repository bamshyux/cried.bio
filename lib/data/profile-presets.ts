import { createClient } from "@/lib/supabase/server";
import { arePresetSnapshotsEqual } from "@/lib/profile-presets/compare";
import {
  freezePresetAssets,
  presetUsesMutableAssets,
} from "@/lib/profile-presets/asset-snapshot";
import { captureProfilePresetSnapshot, parsePresetData, resolvePresetThumbnailUrl } from "@/lib/profile-presets/snapshot";
import type { ProfilePreset, ProfilePresetData } from "@/lib/types/profile-preset";

function normalizePreset(row: Record<string, unknown>): ProfilePreset | null {
  const presetData = parsePresetData(row.preset_data);
  if (!presetData) return null;

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null,
    preset_data: presetData,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

async function repairPresetAssetsIfNeeded(preset: ProfilePreset): Promise<ProfilePreset> {
  if (!presetUsesMutableAssets(preset.user_id, preset.id, preset.preset_data)) {
    return preset;
  }

  const frozen = await freezePresetAssets(preset.user_id, preset.id, preset.preset_data);
  if (frozen.failedAssets.length > 0) {
    return preset;
  }

  const supabase = await createClient();
  const thumbnailUrl = resolvePresetThumbnailUrl(frozen.data);
  await supabase
    .from("profile_presets")
    .update({
      preset_data: frozen.data,
      thumbnail_url: thumbnailUrl,
    })
    .eq("id", preset.id)
    .eq("user_id", preset.user_id);

  return {
    ...preset,
    preset_data: frozen.data,
    thumbnail_url: thumbnailUrl,
  };
}

export async function getProfilePresetsByUserId(userId: string): Promise<ProfilePreset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_presets")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  const presets = data
    .map((row) => normalizePreset(row as Record<string, unknown>))
    .filter(Boolean) as ProfilePreset[];

  return Promise.all(presets.map((preset) => repairPresetAssetsIfNeeded(preset)));
}

export async function getProfilePresetById(
  presetId: string,
  userId?: string,
): Promise<ProfilePreset | null> {
  const supabase = await createClient();
  let query = supabase.from("profile_presets").select("*").eq("id", presetId);
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  const preset = normalizePreset(data as Record<string, unknown>);
  if (!preset) return null;
  return repairPresetAssetsIfNeeded(preset);
}

export async function getActivePresetId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_settings")
    .select("active_preset_id")
    .eq("profile_id", userId)
    .maybeSingle();

  return data?.active_preset_id ? String(data.active_preset_id) : null;
}

export async function setActivePresetId(userId: string, presetId: string | null) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_settings")
    .select("profile_id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!data) {
    await supabase.from("profile_settings").insert({ profile_id: userId });
  }

  await supabase
    .from("profile_settings")
    .update({ active_preset_id: presetId })
    .eq("profile_id", userId);
}

/** Clear the applied preset when the live profile no longer matches it. */
export async function markProfileAppearanceChanged(userId: string) {
  await setActivePresetId(userId, null);
}

/** Returns the active preset id only while the live profile still matches that preset. */
export async function resolveAppliedPresetId(userId: string): Promise<string | null> {
  const activePresetId = await getActivePresetId(userId);
  if (!activePresetId) return null;

  const preset = await getProfilePresetById(activePresetId, userId);
  if (!preset) {
    await setActivePresetId(userId, null);
    return null;
  }

  const currentSnapshot = await captureProfilePresetSnapshot(userId);
  if (!arePresetSnapshotsEqual(preset.preset_data, currentSnapshot)) {
    await setActivePresetId(userId, null);
    return null;
  }

  return activePresetId;
}

export type { ProfilePresetData };
