import type { EmbedType } from "@/lib/types/embed";

export type ParsedEmbed = {
  embed_type: EmbedType;
  embed_id: string;
  title: string;
  url: string;
};

const PATTERNS: { type: EmbedType; regex: RegExp; title: string }[] = [
  { type: "youtube", regex: /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i, title: "YouTube Video" },
  { type: "twitch", regex: /twitch\.tv\/(?:videos\/(\d+)|(\w+))/i, title: "Twitch Stream" },
  { type: "tiktok", regex: /tiktok\.com\/@[\w.]+\/video\/(\d+)/i, title: "TikTok Video" },
  { type: "spotify_playlist", regex: /open\.spotify\.com\/playlist\/([\w\d]+)/i, title: "Spotify Playlist" },
  { type: "spotify_track", regex: /open\.spotify\.com\/track\/([\w\d]+)/i, title: "Spotify Track" },
  { type: "soundcloud", regex: /soundcloud\.com\/([\w-]+\/[\w-]+)/i, title: "SoundCloud Track" },
  { type: "roblox", regex: /roblox\.com\/games\/(\d+)/i, title: "Roblox Game" },
  { type: "discord", regex: /discord(?:\.gg|(?:app)?\.com\/invite)\/([\w-]+)/i, title: "Discord Server" },
];

export function parseEmbedUrl(raw: string): ParsedEmbed | null {
  const url = raw.trim();
  if (!url) return null;

  for (const { type, regex, title } of PATTERNS) {
    const match = url.match(regex);
    if (!match) continue;
    const embedId = match[1] || match[2] || "";
    if (!embedId) continue;
    return { embed_type: type, embed_id: embedId, title, url };
  }

  return null;
}

export function getEmbedIframeSrc(type: EmbedType, embedId: string): string | null {
  switch (type) {
    case "youtube":
      return `https://www.youtube.com/embed/${embedId}`;
    case "twitch":
      return embedId.match(/^\d+$/)
        ? `https://player.twitch.tv/?video=${embedId}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`
        : `https://player.twitch.tv/?channel=${embedId}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`;
    case "tiktok":
      return `https://www.tiktok.com/embed/v2/${embedId}`;
    case "spotify_track":
      return `https://open.spotify.com/embed/track/${embedId}`;
    case "spotify_playlist":
      return `https://open.spotify.com/embed/playlist/${embedId}`;
    case "soundcloud":
      return `https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/${embedId}&color=%2300e5cc`;
    case "roblox":
      return `https://www.roblox.com/games/${embedId}`;
    case "discord":
      return `https://discord.com/widget?id=${embedId}&theme=dark`;
    default:
      return null;
  }
}

/** Server-safe embed src without window */
export function getEmbedIframeSrcServer(type: EmbedType, embedId: string, hostname = "localhost"): string | null {
  switch (type) {
    case "youtube":
      return `https://www.youtube.com/embed/${embedId}`;
    case "twitch":
      return embedId.match(/^\d+$/)
        ? `https://player.twitch.tv/?video=${embedId}&parent=${hostname}`
        : `https://player.twitch.tv/?channel=${embedId}&parent=${hostname}`;
    case "tiktok":
      return `https://www.tiktok.com/embed/v2/${embedId}`;
    case "spotify_track":
      return `https://open.spotify.com/embed/track/${embedId}`;
    case "spotify_playlist":
      return `https://open.spotify.com/embed/playlist/${embedId}`;
    case "soundcloud":
      return `https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/${embedId}&color=%2300e5cc`;
    case "discord":
      return `https://discord.com/widget?id=${embedId}&theme=dark`;
    case "roblox":
      return null;
    default:
      return null;
  }
}
