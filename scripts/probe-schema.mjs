import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no env file */
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const REQUIRED = [
  "profile_id", "layout", "accent_color", "text_color", "background_color",
  "font_family", "animated_gradient", "gradient_colors", "glassmorphism",
  "neon_glow", "border_radius", "profile_opacity", "profile_blur",
  "background_type", "background_image_url", "background_video_url",
  "particle_effect", "overlay_opacity", "vignette", "noise_texture",
  "music_url", "music_title", "music_autoplay", "music_loop", "music_volume",
  "cursor_effect", "typing_bio", "username_effect", "hover_animations",
  "page_entrance", "link_animation", "show_view_count", "show_join_date",
  "profile_status", "featured_link_id", "created_at", "updated_at",
];

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);
const missing = [];
const present = [];

for (const col of REQUIRED) {
  const { error } = await supabase.from("profile_settings").select(col).limit(0);
  if (error && (/could not find the/i.test(error.message) || /does not exist/i.test(error.message))) {
    missing.push(col);
  } else if (error) {
    console.error(`Error probing ${col}:`, error.message);
  } else {
    present.push(col);
  }
}

console.log(JSON.stringify({ present: present.length, missing, total: REQUIRED.length }, null, 2));
