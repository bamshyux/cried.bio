import { getDiscordAvatarUrl } from "@/lib/discord/config";
import { pickActivityImageUrl, resolveActivityAssetUrl } from "@/lib/discord/activity-images";
import { resolveDetectableGameIconUrl } from "@/lib/discord/detectable-apps";
import { parseDiscordProfileBadges, type LanyardDiscordUser } from "@/lib/discord/profile-badges";
import type { DiscordActivity, DiscordPresence, DiscordPresenceStatus } from "@/lib/discord/types";

type LanyardActivity = {
  name?: string;
  details?: string | null;
  state?: string | null;
  type?: number;
  application_id?: string;
  assets?: {
    large_image?: string;
    small_image?: string;
  };
};

type LanyardResponse = {
  success: boolean;
  data?: {
    discord_user?: {
      id: string;
      username: string;
      avatar?: string | null;
      banner?: string | null;
      public_flags?: number | null;
      flags?: number | null;
      premium_type?: number | null;
      display_name_styles?: {
        display_name_font_id?: number | null;
        display_name_effect_id?: number | null;
        display_name_colors?: number[] | null;
      } | null;
      avatar_decoration_data?: {
        asset?: string | null;
        sku_id?: string | null;
      } | null;
      collectibles?: {
        nameplate?: {
          asset?: string | null;
          sku_id?: string | null;
        } | null;
      } | null;
      primary_guild?: {
        tag?: string | null;
        badge?: string | null;
        identity_guild_id?: string | null;
        identity_enabled?: boolean | null;
      } | null;
      clan?: {
        tag?: string | null;
        badge?: string | null;
        identity_guild_id?: string | null;
        identity_enabled?: boolean | null;
      } | null;
    };
    discord_status?: string;
    activities?: LanyardActivity[];
    spotify?: {
      song?: string;
      artist?: string;
      album_art_url?: string;
    } | null;
  };
};

function normalizeStatus(raw?: string): DiscordPresenceStatus {
  if (raw === "online" || raw === "idle" || raw === "dnd" || raw === "offline") {
    return raw;
  }
  return "offline";
}

async function mapActivity(activity: LanyardActivity): Promise<DiscordActivity | null> {
  if (!activity?.name) return null;
  const applicationId = activity.application_id ?? null;
  const mapped: DiscordActivity = {
    name: activity.name,
    details: activity.details ?? undefined,
    state: activity.state ?? undefined,
    type: activity.type,
    applicationId: applicationId ?? undefined,
    largeImageUrl: resolveActivityAssetUrl(activity.assets?.large_image, applicationId),
    smallImageUrl: resolveActivityAssetUrl(activity.assets?.small_image, applicationId),
  };

  if (!pickActivityImageUrl(mapped)) {
    const gameIcon = await resolveDetectableGameIconUrl(applicationId, activity.name);
    if (gameIcon) {
      mapped.largeImageUrl = gameIcon;
    }
  }

  return mapped;
}

async function pickActivity(activities?: LanyardActivity[]): Promise<DiscordActivity | null> {
  if (!activities?.length) return null;
  const custom = activities.find((a) => a.type === 4 && a.name);
  const playing = activities.find((a) => a.name && a.type !== 4 && a.type !== 2);
  const activity = playing ?? custom;
  return activity ? mapActivity(activity) : null;
}

async function fetchLanyardData(discordUserId: string): Promise<LanyardResponse["data"] | null> {
  if (!discordUserId.trim()) return null;

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(discordUserId)}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as LanyardResponse;
    if (!json.success || !json.data?.discord_user) return null;
    return json.data;
  } catch {
    return null;
  }
}

export async function fetchLanyardDiscordUser(
  discordUserId: string,
): Promise<{ username: string; avatar: string | null; banner: string | null; user: LanyardDiscordUser } | null> {
  const data = await fetchLanyardData(discordUserId);
  if (!data?.discord_user?.username) return null;
  return {
    username: data.discord_user.username,
    avatar: data.discord_user.avatar ?? null,
    banner: data.discord_user.banner ?? null,
    user: data.discord_user,
  };
}

export async function fetchLanyardPresence(discordUserId: string): Promise<DiscordPresence | null> {
  const data = await fetchLanyardData(discordUserId);
  if (!data?.discord_user) return null;

  const user = data.discord_user;
  const spotify = data.spotify;

  return {
    userId: user.id,
    username: user.username,
    avatarUrl: getDiscordAvatarUrl(user.id, user.avatar),
    status: normalizeStatus(data.discord_status),
    activity: await pickActivity(data.activities),
    spotify: spotify?.song
      ? {
          song: spotify.song,
          artist: spotify.artist ?? "",
          albumArtUrl: spotify.album_art_url,
        }
      : null,
    profileBadges: parseDiscordProfileBadges(user),
  };
}
