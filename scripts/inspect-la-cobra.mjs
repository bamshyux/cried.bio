import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i <= 0 || line.startsWith("#")) continue;
  env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY);

const { data: listings } = await sb.from("community_theme_listings").select("*");
console.log("listings", listings?.map((l) => ({ id: l.id, title: l.title, preset: l.profile_preset_id, hasPublished: !!l.published_preset_data })));

const cobra = listings?.find((l) => l.title === "la cobra");
if (cobra) {
  const { data: preset } = await sb.from("profile_presets").select("name,preset_data").eq("id", cobra.profile_preset_id).maybeSingle();
  const { data: profile } = await sb.from("profiles").select("display_name,bio,avatar_url,banner_url").eq("id", cobra.author_id).maybeSingle();
  const { data: settings } = await sb.from("profile_settings").select("layout,background_type,background_video_url,background_image_url,music_url,music_title,cursor_image_url,enter_gate_background_image_url,username_effect").eq("profile_id", cobra.author_id).maybeSingle();

  console.log("\n=== LIVE bam profile ===");
  console.log(profile);
  console.log(settings);

  console.log("\n=== LINKED preset (default) ===");
  console.log({
    name: preset?.name,
    display: preset?.preset_data?.profile?.display_name,
    bio: preset?.preset_data?.profile?.bio?.slice(0, 60),
    layout: preset?.preset_data?.settings?.layout,
    bgVideo: preset?.preset_data?.settings?.background_video_url,
    music: preset?.preset_data?.settings?.music_url,
    banner: preset?.preset_data?.profile?.banner_url,
  });

  console.log("\n=== published_preset_data on listing ===");
  const pub = cobra.published_preset_data;
  console.log(pub ? {
    display: pub?.profile?.display_name,
    layout: pub?.settings?.layout,
    bgVideo: pub?.settings?.background_video_url,
    music: pub?.settings?.music_url,
  } : "null/missing column");
}

// check column exists
const { error: colErr } = await sb.from("community_theme_listings").select("published_preset_data").limit(1);
console.log("\npublished_preset_data column:", colErr?.message ?? "exists");
