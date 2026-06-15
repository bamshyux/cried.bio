import { fetchLanyardPresence } from "@/lib/discord/lanyard";
import { mergeDiscordPresence, shouldShowDiscordStatus } from "@/lib/discord/fallback-presence";
import type { DiscordPresence } from "@/lib/discord/types";
import type { ProfileSettings } from "@/lib/types/settings";

export async function getDiscordPresenceForSettings(
  settings: ProfileSettings,
): Promise<DiscordPresence | null> {
  if (!shouldShowDiscordStatus(settings)) {
    return null;
  }

  const live = await fetchLanyardPresence(settings.discord_user_id);
  return mergeDiscordPresence(settings, live);
}
