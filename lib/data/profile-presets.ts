import { createClient } from "@/lib/supabase/server";
import { arePresetSnapshotsEqual } from "@/lib/profile-presets/compare";
import { captureProfilePresetSnapshot } from "@/lib/profile-presets/snapshot";
import type { ProfilePreset, ProfilePresetData } from "@/lib/types/profile-preset";
import { parsePresetData } from "@/lib/profile-presets/snapshot";

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

export async function getProfilePresetsByUserId(userId: string): Promise<ProfilePreset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_presets")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => normalizePreset(row as Record<string, unknown>)).filter(Boolean) as ProfilePreset[];
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
  return normalizePreset(data as Record<string, unknown>);
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
