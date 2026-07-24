import type { ProfileSettings } from "@/lib/types/settings";

/** Premium Lite can hide the floating music player; free profiles always show it. */
export function enforceMusicPlayerVisibility(
  settings: ProfileSettings,
  canHideMusicPlayer: boolean,
): ProfileSettings {
  if (canHideMusicPlayer || settings.music_show_player !== false) {
    return settings;
  }
  return { ...settings, music_show_player: true };
}
