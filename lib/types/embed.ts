export type EmbedType =
  | "youtube"
  | "twitch"
  | "tiktok"
  | "spotify_track"
  | "spotify_playlist"
  | "soundcloud"
  | "roblox"
  | "discord";

export type ProfileEmbed = {
  id: string;
  profile_id: string;
  embed_type: EmbedType;
  url: string;
  title: string;
  embed_id: string;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type EmbedFormState = { error?: string; success?: string };

export const EMBED_TYPE_OPTIONS: { value: EmbedType; label: string }[] = [
  { value: "youtube", label: "YouTube Video" },
  { value: "twitch", label: "Twitch Stream" },
  { value: "tiktok", label: "TikTok Video" },
  { value: "spotify_track", label: "Spotify Track" },
  { value: "spotify_playlist", label: "Spotify Playlist" },
  { value: "soundcloud", label: "SoundCloud Track" },
  { value: "roblox", label: "Roblox Game" },
  { value: "discord", label: "Discord Server Widget" },
];
