"use server";

import { createClient } from "@/lib/supabase/server";
import { mergeSettings } from "@/lib/settings";
import { formatSchemaError } from "@/lib/db/schema";
import { omitUnsupportedSettingsColumns } from "@/lib/db/validate-schema";
import type { SettingsFormState, SettingsSection } from "@/lib/types/settings";
import type {
  BackgroundType,
  CursorEffect,
  LinkAnimation,
  ParticleEffect,
  ProfileLayout,
  ProfileSettings,
  UsernameEffect,
} from "@/lib/types/settings";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

async function revalidateProfile(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/badges");
  revalidatePath("/dashboard/customize");
  revalidatePath("/dashboard/background");
  revalidatePath("/dashboard/music");
  revalidatePath("/dashboard/effects");
  revalidatePath("/dashboard/themes");
  revalidatePath("/dashboard/links");
  if (profile?.username) revalidatePath(`/${profile.username}`);
}

async function getExistingSettings(userId: string): Promise<ProfileSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_settings")
    .select("*")
    .eq("profile_id", userId)
    .maybeSingle();
  return mergeSettings(data as Partial<ProfileSettings> | null, userId);
}

async function ensureSettingsRow(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_settings")
    .select("profile_id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!data) {
    // Insert minimal row — DB column defaults apply (avoids sending columns that may not exist yet)
    await supabase.from("profile_settings").insert({ profile_id: userId });
  }
}

async function patchProfileSettings(
  userId: string,
  patch: Partial<Omit<ProfileSettings, "profile_id" | "created_at" | "updated_at">>,
): Promise<{ error?: string }> {
  const safePatch = await omitUnsupportedSettingsColumns(patch);
  if (Object.keys(safePatch).length === 0) {
    return { error: "No settings to save." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_settings")
    .update(safePatch)
    .eq("profile_id", userId);

  if (error) return { error: formatSchemaError(error.message) };
  return {};
}

function parseBool(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

function parseIntField(value: FormDataEntryValue | null, fallback: number) {
  const n = parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseGradient(raw: string, fallback: string[]) {
  if (!raw.trim()) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* fall through */
  }
  return raw.split(",").map((c) => c.trim()).filter(Boolean);
}

function parseParticle(value: string): ParticleEffect | null {
  const v = value.trim();
  if (!v) return null;
  return v as ParticleEffect;
}

function parseSectionUpdates(
  section: SettingsSection,
  formData: FormData,
  existing: ProfileSettings,
): Partial<ProfileSettings> {
  switch (section) {
    case "customize":
      return {
        accent_color: String(formData.get("accent_color") ?? existing.accent_color),
        text_color: String(formData.get("text_color") ?? existing.text_color),
        font_family: String(formData.get("font_family") ?? existing.font_family),
        glassmorphism: parseBool(formData.get("glassmorphism")),
        neon_glow: parseBool(formData.get("neon_glow")),
        border_radius: parseIntField(formData.get("border_radius"), existing.border_radius),
        profile_opacity: parseIntField(formData.get("profile_opacity"), existing.profile_opacity),
        profile_blur: parseIntField(formData.get("profile_blur"), existing.profile_blur),
        link_animation: String(formData.get("link_animation") ?? existing.link_animation) as LinkAnimation,
        profile_status: String(formData.get("profile_status") ?? existing.profile_status),
        profile_status_color: parseBool(formData.get("profile_status_use_accent"))
          ? ""
          : String(formData.get("profile_status_color") ?? existing.profile_status_color),
        show_view_count: parseBool(formData.get("show_view_count")),
        show_join_date: parseBool(formData.get("show_join_date")),
        profile_parallax: parseBool(formData.get("profile_parallax")),
      };
    case "links":
      return {
        links_monochrome: parseBool(formData.get("links_monochrome")),
        links_style: String(formData.get("links_style") ?? existing.links_style) as import("@/lib/types/settings").LinksStyle,
      };
    case "background":
      return {
        background_type: String(formData.get("background_type") ?? existing.background_type) as BackgroundType,
        background_color: String(formData.get("background_color") ?? existing.background_color),
        gradient_colors: parseGradient(
          String(formData.get("gradient_colors") ?? ""),
          existing.gradient_colors,
        ),
        animated_gradient: parseBool(formData.get("animated_gradient")),
        particle_effect: parseParticle(String(formData.get("particle_effect") ?? "")),
        overlay_opacity: parseIntField(formData.get("overlay_opacity"), existing.overlay_opacity),
        vignette: parseBool(formData.get("vignette")),
        noise_texture: parseBool(formData.get("noise_texture")),
      };
    case "themes":
      return {
        layout: String(formData.get("layout") ?? existing.layout) as ProfileLayout,
      };
    case "music":
      return {
        music_title: String(formData.get("music_title") ?? existing.music_title).trim(),
        music_autoplay: parseBool(formData.get("music_autoplay")),
        music_loop: parseBool(formData.get("music_loop")),
        music_volume: parseIntField(formData.get("music_volume"), existing.music_volume),
        music_player_color: parseBool(formData.get("music_use_accent"))
          ? ""
          : String(formData.get("music_player_color") ?? existing.music_player_color),
      };
    case "effects":
      return {
        cursor_effect: String(formData.get("cursor_effect") ?? existing.cursor_effect) as CursorEffect,
        typing_bio: parseBool(formData.get("typing_bio")),
        username_effect: String(formData.get("username_effect") ?? existing.username_effect) as UsernameEffect,
        hover_animations: parseBool(formData.get("hover_animations")),
        page_entrance: parseBool(formData.get("page_entrance")),
      };
    default:
      return {};
  }
}

export async function updateSettingsAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const section = String(formData.get("_section") ?? "") as SettingsSection;
  if (!section) return { error: "Invalid settings section." };

  await ensureSettingsRow(userId);
  const existing = await getExistingSettings(userId);
  const updates = parseSectionUpdates(section, formData, existing);

  const { error } = await patchProfileSettings(userId, updates);
  if (error) return { error };

  await revalidateProfile(userId);
  return { success: "Settings saved." };
}

const MAX_BG_SIZE = 50 * 1024 * 1024;
const MAX_MUSIC_SIZE = 20 * 1024 * 1024;

async function uploadFile(
  userId: string,
  file: File,
  bucket: "backgrounds" | "music",
  filename: string,
) {
  const supabase = await createClient();
  const path = `${userId}/${filename}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

async function deleteStoragePrefix(
  userId: string,
  bucket: "backgrounds" | "music",
  namePrefix: string,
) {
  const supabase = await createClient();
  const { data: files } = await supabase.storage.from(bucket).list(userId);
  if (!files?.length) return;

  const paths = files
    .filter((f) => f.name.startsWith(namePrefix))
    .map((f) => `${userId}/${f.name}`);

  if (paths.length > 0) {
    await supabase.storage.from(bucket).remove(paths);
  }
}

export async function saveBackgroundMediaAction(
  mediaUrl: string,
  mediaType: "image" | "video",
): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  if (!mediaUrl.trim()) return { error: "Invalid background URL." };

  await ensureSettingsRow(userId);

  const update =
    mediaType === "video"
      ? { background_type: "video" as const, background_video_url: mediaUrl, background_image_url: null }
      : { background_type: "image" as const, background_image_url: mediaUrl, background_video_url: null };

  const { error } = await patchProfileSettings(userId, update);
  if (error) return { error };

  await revalidateProfile(userId);
  return {
    success: mediaType === "video" ? "Video background uploaded." : "Image background uploaded.",
  };
}

export async function uploadBackgroundAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const file = formData.get("background");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please select a file." };
  }

  if (file.size > MAX_BG_SIZE) return { error: "File must be 50 MB or smaller." };

  await ensureSettingsRow(userId);

  const isVideo = file.type === "video/mp4";
  const isImage = file.type.startsWith("image/");

  if (!isVideo && !isImage) {
    return { error: "Upload a JPEG, PNG, WebP, GIF, or MP4 file." };
  }

  try {
    const ext = isVideo ? "mp4" : file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const url = await uploadFile(userId, file, "backgrounds", `background.${ext}`);
    return saveBackgroundMediaAction(url, isVideo ? "video" : "image");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export async function uploadMusicAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const file = formData.get("music");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please select an audio file." };
  }

  if (file.size > MAX_MUSIC_SIZE) return { error: "Audio must be 20 MB or smaller." };
  if (!file.type.startsWith("audio/")) return { error: "Upload MP3, WAV, OGG, or WebM audio." };

  await ensureSettingsRow(userId);

  try {
    const ext = file.type.split("/")[1]?.replace("mpeg", "mp3") ?? "mp3";
    const url = await uploadFile(userId, file, "music", `track.${ext}`);

    const { error } = await patchProfileSettings(userId, { music_url: url });
    if (error) return { error };

    await revalidateProfile(userId);
    return { success: "Music uploaded." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export async function removeBackgroundAction(): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const { error } = await patchProfileSettings(userId, {
    background_image_url: null,
    background_video_url: null,
  });

  if (error) return { error };

  await deleteStoragePrefix(userId, "backgrounds", "background.");

  await revalidateProfile(userId);
  return { success: "Background removed." };
}

export async function removeMusicAction(): Promise<SettingsFormState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "You must be logged in." };

  const { error } = await patchProfileSettings(userId, { music_url: null });
  if (error) return { error };

  await deleteStoragePrefix(userId, "music", "track.");

  await revalidateProfile(userId);
  return { success: "Music removed." };
}
