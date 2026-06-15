import { isValidDiscordUserId } from "@/lib/discord/connection";
import { getDiscordAvatarUrl } from "@/lib/discord/config";
import { getEffectiveDiscordUsername } from "@/lib/discord/resolve-profile";
import type { DiscordPresence } from "@/lib/discord/types";
import type { ProfileSettings } from "@/lib/types/settings";

export function buildFallbackDiscordPresence(settings: ProfileSettings): DiscordPresence | null {
  if (!isValidDiscordUserId(settings.discord_user_id)) return null;

  const username = getEffectiveDiscordUsername(settings.discord_username);
  if (!username) return null;

  return {
    userId: settings.discord_user_id,
    username,
    avatarUrl: getDiscordAvatarUrl(settings.discord_user_id, settings.discord_avatar || null),
    status: "offline",
    activity: null,
    spotify: null,
  };
}

export function mergeDiscordPresence(
  settings: ProfileSettings,
  live: DiscordPresence | null,
): DiscordPresence | null {
  if (live) {
    return {
      ...live,
      username: live.username || getEffectiveDiscordUsername(settings.discord_username),
      avatarUrl:
        live.avatarUrl ??
        getDiscordAvatarUrl(settings.discord_user_id, settings.discord_avatar || null),
    };
  }
  return buildFallbackDiscordPresence(settings);
}

export function shouldShowDiscordStatus(settings: ProfileSettings): boolean {
  return isValidDiscordUserId(settings.discord_user_id) && settings.show_discord_status === true;
}
