export type DiscordPresenceStatus = "online" | "idle" | "dnd" | "offline";

export type HypeSquadHouse = "bravery" | "brilliance" | "balance";

export type DiscordGuildTag = {
  tag: string;
  guildId: string;
  badgeUrl: string;
};

export type DiscordProfileBadges = {
  guildTag: DiscordGuildTag | null;
  nitro: boolean;
  hypesquad: HypeSquadHouse | null;
};

export type DiscordActivity = {
  name: string;
  details?: string;
  state?: string;
  type?: number;
  applicationId?: string;
  largeImageUrl?: string | null;
  smallImageUrl?: string | null;
};

export type DiscordSpotify = {
  song: string;
  artist: string;
  albumArtUrl?: string;
};

export type DiscordPresence = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  status: DiscordPresenceStatus;
  activity: DiscordActivity | null;
  spotify: DiscordSpotify | null;
  profileBadges: DiscordProfileBadges;
};

export type DiscordOAuthUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  banner?: string | null;
  premium_type?: number | null;
  display_name_styles?: {
    display_name_font_id?: number | null;
    display_name_effect_id?: number | null;
    display_name_colors?: number[] | null;
  } | null;
};
