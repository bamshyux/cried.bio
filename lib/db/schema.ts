/**
 * Columns the app expects on public.profile_settings.
 * Keep in sync with supabase/v2_features.sql + supabase/v3_features.sql.
 */
export const REQUIRED_PROFILE_SETTINGS_COLUMNS = [
  "profile_id",
  "layout",
  "accent_color",
  "text_color",
  "background_color",
  "font_family",
  "animated_gradient",
  "gradient_colors",
  "glassmorphism",
  "neon_glow",
  "border_radius",
  "profile_opacity",
  "profile_blur",
  "background_type",
  "background_image_url",
  "background_video_url",
  "particle_effect",
  "overlay_opacity",
  "vignette",
  "noise_texture",
  "music_url",
  "music_title",
  "music_autoplay",
  "music_loop",
  "music_volume",
  "cursor_effect",
  "typing_bio",
  "username_effect",
  "hover_animations",
  "page_entrance",
  "link_animation",
  "show_view_count",
  "show_join_date",
  "profile_status",
  "profile_status_color",
  "music_player_color",
  "featured_link_id",
  "show_badges",
  "badge_display_limit",
  "badges_monochrome",
  "badge_color",
  "links_monochrome",
  "links_style",
  "profile_parallax",
  "status_preset",
  "status_emoji",
  "guestbook_enabled",
  "guestbook_approval_required",
  "show_follow_counts",
  "show_activity",
  "friends_visibility",
  "created_at",
  "updated_at",
] as const;

export type SchemaValidationResult =
  | { ok: true }
  | { ok: false; missing: string[]; message: string };

export const SCHEMA_MIGRATION_HINT =
  "Run the relevant supabase/*.sql migrations in the Supabase SQL Editor, then restart the dev server.";

const COLUMN_MIGRATIONS: Record<string, string> = {
  music_title: "supabase/v4_music_title.sql",
  show_badges: "supabase/v5_badges.sql",
  badge_display_limit: "supabase/v5_badges.sql",
  badges_monochrome: "supabase/v7_badge_customization.sql",
  badge_color: "supabase/v7_badge_customization.sql",
  links_monochrome: "supabase/v10_links_parallax.sql",
  links_style: "supabase/v14_links_style.sql",
  profile_parallax: "supabase/v10_links_parallax.sql",
  profile_status_color: "supabase/v11_ui_colors.sql",
  music_player_color: "supabase/v11_ui_colors.sql",
  status_preset: "supabase/v12_v2_expansion.sql",
  status_emoji: "supabase/v12_v2_expansion.sql",
  guestbook_enabled: "supabase/v12_v2_expansion.sql",
  guestbook_approval_required: "supabase/v12_v2_expansion.sql",
  show_follow_counts: "supabase/v13_show_follow_counts.sql",
  show_activity: "supabase/v15_show_activity.sql",
  friends_visibility: "supabase/v12_v2_expansion.sql",
  overlay_opacity: "supabase/v3_features.sql",
  vignette: "supabase/v3_features.sql",
  noise_texture: "supabase/v3_features.sql",
  cursor_effect: "supabase/v3_features.sql",
  username_effect: "supabase/v3_features.sql",
  show_view_count: "supabase/v3_features.sql",
  show_join_date: "supabase/v3_features.sql",
  profile_status: "supabase/v3_features.sql",
  featured_link_id: "supabase/v3_features.sql",
};

/** Which migration file(s) to run for missing columns */
export function getMigrationFilesForMissing(missing: string[]): string[] {
  const files = new Set<string>();
  for (const col of missing) {
    const file = COLUMN_MIGRATIONS[col];
    if (file) files.add(file);
  }
  if (files.size === 0) {
    return ["supabase/v3_features.sql", "supabase/v4_music_title.sql", "supabase/v5_badges.sql"];
  }
  return Array.from(files);
}

export function buildSchemaValidationMessage(missing: string[]): string {
  const files = getMigrationFilesForMissing(missing);
  const fileList = files.join(", then ");
  return `Missing profile_settings columns: ${missing.join(", ")}. Run ${fileList} in the Supabase SQL Editor, then restart the dev server.`;
}

export function isSchemaCacheError(message: string) {
  return /could not find the '([^']+)' column/i.test(message) ||
    /schema cache/i.test(message) ||
    /column profile_settings\.\w+ does not exist/i.test(message);
}

export function parseMissingColumn(message: string): string | null {
  const cacheMatch = message.match(/could not find the '([^']+)' column/i);
  if (cacheMatch?.[1]) return cacheMatch[1];

  const pgMatch = message.match(/column profile_settings\.(\w+) does not exist/i);
  return pgMatch?.[1] ?? null;
}

export function formatSchemaError(errorMessage: string): string {
  const missing = parseMissingColumn(errorMessage);
  if (missing) {
    return `Database schema is missing column "${missing}". ${SCHEMA_MIGRATION_HINT}`;
  }
  if (isSchemaCacheError(errorMessage)) {
    return `Database schema is out of date. ${SCHEMA_MIGRATION_HINT}`;
  }
  return errorMessage;
}
