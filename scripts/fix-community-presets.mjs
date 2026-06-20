import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i <= 0 || line.startsWith("#")) continue;
  const key = line.slice(0, i).trim();
  let value = line.slice(i + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY);

const SETTINGS_EXCLUDE = new Set([
  "profile_id",
  "created_at",
  "updated_at",
  "discord_user_id",
  "discord_username",
  "discord_avatar",
  "discord_banner",
  "discord_premium_type",
  "custom_theme_id",
  "active_preset_id",
  "discord_card_config",
  "discord_card_style",
  "discord_show_lanyard_hint",
]);

const BACKGROUND_KEYS = [
  "background_type",
  "background_color",
  "background_image_url",
  "background_video_url",
  "gradient_colors",
  "animated_gradient",
  "particle_effect",
  "overlay_opacity",
  "vignette",
  "noise_texture",
  "enter_gate_background_type",
  "enter_gate_background_color",
  "enter_gate_background_image_url",
  "enter_gate_background_video_url",
  "enter_gate_gradient_colors",
  "enter_gate_animated_gradient",
  "enter_gate_overlay_opacity",
  "enter_gate_vignette",
  "enter_gate_noise",
  "enter_gate_particle_effect",
];

function extractSettings(settings) {
  const result = {};
  for (const [k, v] of Object.entries(settings ?? {})) {
    if (!SETTINGS_EXCLUDE.has(k)) result[k] = v;
  }
  for (const key of BACKGROUND_KEYS) {
    if (settings?.[key] !== undefined) result[key] = settings[key];
  }
  result.featured_link_id = null;
  return result;
}

function finalizeStyleSnapshot(data) {
  return {
    ...data,
    profile: {
      display_name: "",
      bio: "",
      avatar_url: data.profile.avatar_url,
      banner_url: data.profile.banner_url,
    },
    links: [],
    profileBadges: [],
    featuredLinkIndex: null,
    settings: { ...data.settings, featured_link_id: null },
  };
}

async function captureStyleSnapshot(userId) {
  const [
    profileRes,
    settingsRes,
    embedsRes,
    featuredRes,
    widgetRes,
    themesRes,
  ] = await Promise.all([
    sb.from("profiles").select("*").eq("id", userId).maybeSingle(),
    sb.from("profile_settings").select("*").eq("profile_id", userId).maybeSingle(),
    sb.from("profile_embeds").select("*").eq("profile_id", userId).order("sort_order"),
    sb.from("featured_blocks").select("*").eq("profile_id", userId).order("sort_order"),
    sb.from("profile_widgets").select("*").eq("profile_id", userId).eq("widget_type", "discord_status").maybeSingle(),
    sb.from("custom_themes").select("*").eq("profile_id", userId).order("sort_order"),
  ]);

  const profile = profileRes.data;
  const settings = settingsRes.data;
  if (!profile || !settings) throw new Error("Profile or settings missing");

  let customTheme = null;
  if (settings.layout === "custom" && settings.custom_theme_id) {
    const theme = (themesRes.data ?? []).find((t) => t.id === settings.custom_theme_id);
    if (theme) customTheme = { name: theme.name, css: theme.css };
  }

  const discordWidget = widgetRes.data
    ? { is_enabled: widgetRes.data.is_enabled, config: widgetRes.data.config }
    : settings.show_discord_status
      ? { is_enabled: true, config: settings.discord_card_config ?? {} }
      : null;

  const raw = {
    version: 1,
    profile: {
      display_name: profile.display_name ?? "",
      bio: profile.bio ?? "",
      avatar_url: profile.avatar_url ?? null,
      banner_url: profile.banner_url ?? null,
    },
    settings: extractSettings(settings),
    links: [],
    embeds: (embedsRes.data ?? []).map((embed) => ({
      embed_type: embed.embed_type,
      url: embed.url,
      title: embed.title,
      embed_id: embed.embed_id,
      is_visible: embed.is_visible,
      sort_order: embed.sort_order,
      config: embed.config,
    })),
    featuredBlocks: (featuredRes.data ?? []).map((block) => ({
      block_type: block.block_type,
      title: block.title,
      description: block.description,
      thumbnail_url: block.thumbnail_url,
      url: block.url,
      accent_color: block.accent_color,
      is_enabled: block.is_enabled,
      sort_order: block.sort_order,
    })),
    profileBadges: [],
    discordWidget,
    customTheme,
    featuredLinkIndex: null,
  };

  return finalizeStyleSnapshot(raw);
}

function thumbnailFromSnapshot(data) {
  const bgVideo = data.settings?.background_video_url;
  if (typeof bgVideo === "string" && bgVideo.trim()) return bgVideo;
  const bgImage = data.settings?.background_image_url;
  if (typeof bgImage === "string" && bgImage.trim()) return bgImage;
  const enterGate = data.settings?.enter_gate_background_image_url;
  if (typeof enterGate === "string" && enterGate.trim()) return enterGate;
  if (data.profile.banner_url) return data.profile.banner_url;
  if (data.profile.avatar_url) return data.profile.avatar_url;
  return null;
}

// Delete pig listing
const PIG_ID = "d9b82336-e895-4511-9cd9-beff8f4af4e1";
for (const table of ["community_theme_likes", "community_theme_installs"]) {
  const { error } = await sb.from(table).delete().eq("listing_id", PIG_ID);
  if (error) console.log(`delete ${table}`, error.message);
}
const { error: pigDeleteError } = await sb.from("community_theme_listings").delete().eq("id", PIG_ID);
console.log(pigDeleteError ? `pig delete error: ${pigDeleteError.message}` : "deleted pig listing");

// Refresh la cobra from bam live profile
const COBRA_ID = "66f39d51-bc6f-4c18-874f-ed71ca550f12";
const BAM_ID = "c42892f6-fcc7-4b6b-8e8c-d9696dc1356d";
const DEFAULT_PRESET_ID = "22b25152-5171-47b8-abab-7608137cd8e7";

const snapshot = await captureStyleSnapshot(BAM_ID);
const thumbnail = thumbnailFromSnapshot(snapshot);

console.log("captured la cobra snapshot", {
  layout: snapshot.settings.layout,
  bgVideo: snapshot.settings.background_video_url,
  music: snapshot.settings.music_url,
  musicTitle: snapshot.settings.music_title,
  cursor: snapshot.settings.cursor_image_url,
  enterGate: snapshot.settings.enter_gate_background_image_url,
  avatar: snapshot.profile.avatar_url,
});

const { error: presetError } = await sb
  .from("profile_presets")
  .update({ preset_data: snapshot, thumbnail_url: thumbnail })
  .eq("id", DEFAULT_PRESET_ID)
  .eq("user_id", BAM_ID);
console.log(presetError ? `preset update error: ${presetError.message}` : "updated default preset snapshot");

const listingPatch = {
  preview_image_url: thumbnail,
  updated_at: new Date().toISOString(),
};

const { error: listingError } = await sb
  .from("community_theme_listings")
  .update(listingPatch)
  .eq("id", COBRA_ID);
console.log(listingError ? `listing update error: ${listingError.message}` : "updated la cobra listing preview");

// Try published_preset_data if column exists
const { error: snapshotColCheck } = await sb
  .from("community_theme_listings")
  .select("published_preset_data")
  .limit(1);

if (!snapshotColCheck) {
  const { error: publishError } = await sb
    .from("community_theme_listings")
    .update({ published_preset_data: snapshot, preview_image_url: thumbnail })
    .eq("id", COBRA_ID);
  console.log(publishError ? `published snapshot error: ${publishError.message}` : "froze la cobra published_preset_data");
} else {
  console.log("published_preset_data column missing — run supabase/v67_community_preset_snapshots.sql in Supabase SQL Editor");
}

const outDir = path.join("scripts", "recovered-presets");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "la-cobra-style-snapshot.json"), JSON.stringify(snapshot, null, 2));
console.log("wrote scripts/recovered-presets/la-cobra-style-snapshot.json");
