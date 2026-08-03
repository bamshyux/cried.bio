import type { EmbedConfig, EmbedType } from "@/lib/types/embed";
import type { FeaturedBlockType } from "@/lib/types/featured";
import type { LinkAnimation } from "@/lib/types/settings";
import type { DiscordCardConfig } from "@/lib/types/discord-widget";

export type ProfilePreset = {
  id: string;
  user_id: string;
  name: string;
  thumbnail_url: string | null;
  preset_data: ProfilePresetData;
  created_at: string;
  updated_at: string;
};

export type ProfilePresetFormState = {
  error?: string;
  success?: string;
  presetId?: string;
};

export const MAX_PROFILE_PRESETS = 15;
export const PRESET_DATA_VERSION = 1 as const;

export type ProfilePresetLink = {
  title: string;
  url: string;
  icon: string;
  color: string;
  background_color: string;
  animation: LinkAnimation;
  is_featured: boolean;
  sort_order: number;
};

export type ProfilePresetEmbed = {
  embed_type: EmbedType;
  url: string;
  title: string;
  embed_id: string;
  is_visible: boolean;
  sort_order: number;
  config: EmbedConfig;
};

export type ProfilePresetFeaturedBlock = {
  block_type: FeaturedBlockType;
  title: string;
  description: string;
  thumbnail_url: string | null;
  url: string;
  accent_color: string;
  is_enabled: boolean;
  sort_order: number;
};

export type ProfilePresetBadgeDisplay = {
  badge_id: string;
  is_visible: boolean;
  is_featured: boolean;
  sort_order: number;
};

export type ProfilePresetCustomTheme = {
  name: string;
  css: string;
};

export type ProfilePresetDiscordWidget = {
  is_enabled: boolean;
  config: DiscordCardConfig;
};

export type ProfilePresetMusicTrack = {
  url: string;
  title: string;
  sort_order: number;
};

export type ProfilePresetData = {
  version: typeof PRESET_DATA_VERSION;
  profile: {
    display_name: string;
    bio: string;
    location: string;
    avatar_url: string | null;
    banner_url: string | null;
  };
  settings: Record<string, unknown>;
  links: ProfilePresetLink[];
  embeds: ProfilePresetEmbed[];
  featuredBlocks: ProfilePresetFeaturedBlock[];
  profileBadges: ProfilePresetBadgeDisplay[];
  musicTracks: ProfilePresetMusicTrack[];
  musicDefaultTrackIndex: number | null;
  discordWidget: ProfilePresetDiscordWidget | null;
  customTheme: ProfilePresetCustomTheme | null;
  featuredLinkIndex: number | null;
};
