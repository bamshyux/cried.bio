import type { ProfileSettings } from "@/lib/types/settings";

/** Guestbook appearance + toggle fields stored in presets. */
export const GUESTBOOK_PRESET_KEYS = [
  "guestbook_enabled",
  "guestbook_approval_required",
  "guestbook_use_profile_card",
  "guestbook_opacity",
  "guestbook_blur",
  "guestbook_glassmorphism",
  "guestbook_show_background",
  "guestbook_background_color",
  "guestbook_message_opacity",
  "guestbook_author_opacity",
  "guestbook_label_opacity",
  "guestbook_text_color",
  "guestbook_border_style",
  "guestbook_spacing",
  "guestbook_padding_y",
] as const satisfies readonly (keyof ProfileSettings)[];

/** Music player fields stored in presets. */
export const MEDIA_PRESET_KEYS = [
  "music_url",
  "music_title",
  "music_autoplay",
  "music_loop",
  "music_show_player",
  "music_volume",
  "music_player_color",
] as const satisfies readonly (keyof ProfileSettings)[];

/** Premium playlist controls stored in presets. */
export const MUSIC_PLAYLIST_PRESET_KEYS = [
  "music_playlist_mode",
  "music_shuffle",
  "music_autoplay_next",
  "music_default_track_id",
] as const;

export const PRESET_SETTINGS_EXTRA_SELECT = [
  ...GUESTBOOK_PRESET_KEYS,
  ...MEDIA_PRESET_KEYS,
  ...MUSIC_PLAYLIST_PRESET_KEYS,
].join(",");

export function pickPresetExtraSettings(input: Record<string, unknown>): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const key of [...GUESTBOOK_PRESET_KEYS, ...MEDIA_PRESET_KEYS, ...MUSIC_PLAYLIST_PRESET_KEYS]) {
    if (key in input) picked[key] = input[key];
  }
  return picked;
}
