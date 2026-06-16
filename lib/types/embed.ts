export type EmbedType =
  | "youtube"
  | "twitch"
  | "tiktok"
  | "spotify_track"
  | "spotify_playlist"
  | "soundcloud"
  | "roblox"
  | "roblox_profile"
  | "discord";

export type EmbedDisplayMode = "iframe" | "card" | "minimal";
export type EmbedAspectRatio = "16:9" | "4:3" | "1:1" | "9:16" | "auto";
export type EmbedCardStyle = "default" | "minimal" | "glass" | "bordered";
export type EmbedAlignment = "left" | "center" | "right" | "stretch";
export type EmbedTheme = "dark" | "light";

export type EmbedConfig = {
  display_mode: EmbedDisplayMode;
  aspect_ratio: EmbedAspectRatio;
  card_style: EmbedCardStyle;
  alignment: EmbedAlignment;
  show_title: boolean;
  custom_title: string;
  description: string;
  accent_color: string;
  background_color: string;
  border_radius: number;
  show_border: boolean;
  border_color: string;
  theme: EmbedTheme;
  compact_player: boolean;
  autoplay: boolean;
  show_avatar: boolean;
  show_username: boolean;
  show_stats: boolean;
  show_thumbnail: boolean;
  avatar_url: string;
  thumbnail_url: string;
  username: string;
  display_name: string;
};

export type ProfileEmbed = {
  id: string;
  profile_id: string;
  embed_type: EmbedType;
  url: string;
  title: string;
  embed_id: string;
  is_visible: boolean;
  sort_order: number;
  config: EmbedConfig;
  created_at: string;
  updated_at: string;
};

export type EmbedFormState = { error?: string; success?: string };

export type ParsedEmbed = {
  embed_type: EmbedType;
  embed_id: string;
  title: string;
  url: string;
};

export const EMBED_TYPE_OPTIONS: { value: EmbedType; label: string }[] = [
  { value: "youtube", label: "YouTube Video" },
  { value: "twitch", label: "Twitch Stream" },
  { value: "tiktok", label: "TikTok Video" },
  { value: "spotify_track", label: "Spotify Track" },
  { value: "spotify_playlist", label: "Spotify Playlist" },
  { value: "soundcloud", label: "SoundCloud Track" },
  { value: "roblox", label: "Roblox Game" },
  { value: "roblox_profile", label: "Roblox Profile" },
  { value: "discord", label: "Discord Server Widget" },
];
