import type { EmbedConfig, EmbedType } from "@/lib/types/embed";
import type { ParsedEmbed } from "@/lib/types/embed";
import { buildRobloxProfileUrl } from "@/lib/embeds/roblox-profile";

export type { ParsedEmbed } from "@/lib/types/embed";

const PATTERNS: { type: EmbedType; regex: RegExp; title: string }[] = [
  { type: "youtube", regex: /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i, title: "YouTube Video" },
  { type: "twitch", regex: /twitch\.tv\/(?:videos\/(\d+)|(\w+))/i, title: "Twitch Stream" },
  { type: "tiktok", regex: /tiktok\.com\/@[\w.]+\/video\/(\d+)/i, title: "TikTok Video" },
  { type: "spotify_playlist", regex: /open\.spotify\.com\/playlist\/([\w\d]+)/i, title: "Spotify Playlist" },
  { type: "spotify_track", regex: /open\.spotify\.com\/track\/([\w\d]+)/i, title: "Spotify Track" },
  { type: "soundcloud", regex: /soundcloud\.com\/([\w-]+\/[\w-]+)/i, title: "SoundCloud Track" },
  { type: "roblox_profile", regex: /roblox\.com\/users\/(\d+)(?:\/profile)?(?:[/?#]|$)/i, title: "Roblox Profile" },
  { type: "roblox_profile", regex: /roblox\.com\/users\/profile\?username=([\w.]+)/i, title: "Roblox Profile" },
  { type: "roblox_profile", regex: /roblox\.com\/@([\w.]+)/i, title: "Roblox Profile" },
  { type: "roblox_profile", regex: /roblox\.com\/user\.aspx\?username=([\w.]+)/i, title: "Roblox Profile" },
  { type: "roblox", regex: /roblox\.com\/games\/(\d+)/i, title: "Roblox Game" },
  { type: "discord", regex: /discord(?:\.gg|(?:app)?\.com\/invite)\/([\w-]+)/i, title: "Discord Server" },
];

function spotifyTheme(config?: Partial<EmbedConfig>) {
  return config?.theme === "light" ? "0" : "0";
}

function soundcloudColor(config?: Partial<EmbedConfig>) {
  if (config?.accent_color) {
    return encodeURIComponent(config.accent_color.replace("#", "%23"));
  }
  return config?.theme === "light" ? "%23fafafa" : "%23fafafa";
}

export function parseEmbedUrl(raw: string): ParsedEmbed | null {
  const inputUrl = raw.trim();
  if (!inputUrl) return null;

  for (const { type, regex, title } of PATTERNS) {
    const match = inputUrl.match(regex);
    if (!match) continue;
    const embedId = match[1] || match[2] || "";
    if (!embedId) continue;
    return {
      embed_type: type,
      embed_id: embedId,
      title,
      url: type === "roblox_profile" ? buildRobloxProfileUrl(embedId) : inputUrl,
    };
  }

  return null;
}

export function getEmbedIframeSrc(
  type: EmbedType,
  embedId: string,
  config?: Partial<EmbedConfig>,
  hostname = typeof window !== "undefined" ? window.location.hostname : "localhost",
): string | null {
  return getEmbedIframeSrcServer(type, embedId, hostname, config);
}

/** Server-safe embed src without window */
export function getEmbedIframeSrcServer(
  type: EmbedType,
  embedId: string,
  hostname = "localhost",
  config?: Partial<EmbedConfig>,
): string | null {
  const theme = config?.theme === "light" ? "light" : "dark";
  const autoplay = config?.autoplay ? "1" : "0";

  switch (type) {
    case "youtube":
      return `https://www.youtube.com/embed/${embedId}?autoplay=${autoplay}&rel=0`;
    case "twitch":
      return embedId.match(/^\d+$/)
        ? `https://player.twitch.tv/?video=${embedId}&parent=${hostname}`
        : `https://player.twitch.tv/?channel=${embedId}&parent=${hostname}`;
    case "tiktok":
      return `https://www.tiktok.com/embed/v2/${embedId}`;
    case "spotify_track":
      return `https://open.spotify.com/embed/track/${embedId}?theme=${spotifyTheme(config)}&utm_source=generator`;
    case "spotify_playlist":
      return `https://open.spotify.com/embed/playlist/${embedId}?theme=${spotifyTheme(config)}&utm_source=generator`;
    case "soundcloud":
      return `https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/${embedId}&color=${soundcloudColor(config)}&auto_play=${autoplay === "1"}`;
    case "discord":
      if (/^\d{17,20}$/.test(embedId)) {
        return `https://discord.com/widget?id=${embedId}&theme=${theme}`;
      }
      return `https://discord.com/widget?invite=${encodeURIComponent(embedId)}&theme=${theme}`;
    case "roblox":
    case "roblox_profile":
      return null;
    default:
      return null;
  }
}
