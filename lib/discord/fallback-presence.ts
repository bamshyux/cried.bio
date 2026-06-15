import { getDiscordAvatarUrl } from "@/lib/discord/config";
import type { DiscordPresence } from "@/lib/discord/types";
import type { ProfileSettings } from "@/lib/types/settings";

export function buildFallbackDiscordPresence(settings: ProfileSettings): DiscordPresence {
  return {
    userId: settings.discord_user_id,
    username: settings.discord_username || "Discord",
    avatarUrl: settings.discord_user_id
      ? getDiscordAvatarUrl(settings.discord_user_id, settings.discord_avatar || null)
      : null,
    status: "offline",
    activity: null,
    spotify: null,
  };
}

export function mergeDiscordPresence(
  settings: ProfileSettings,
  live: DiscordPresence | null,
): DiscordPresence {
  if (live) {
    return {
      ...live,
      username: settings.discord_username || live.username,
      avatarUrl:
        live.avatarUrl ??
        (settings.discord_user_id
          ? getDiscordAvatarUrl(settings.discord_user_id, settings.discord_avatar || null)
          : null),
    };
  }
  return buildFallbackDiscordPresence(settings);
}

export function shouldShowDiscordStatus(settings: ProfileSettings): boolean {
  return settings.show_discord_status && Boolean(settings.discord_user_id.trim());
}
