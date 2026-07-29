import { isCustomLinkIcon, normalizeLinkIconKey } from "@/lib/links";
import { getPlatform, type SocialPlatformId } from "@/lib/social-platforms";
import type { ProfileLink } from "@/lib/types/link";

export type ParsedSocialLink = {
  linkId: string;
  platformId: SocialPlatformId;
  url: string;
  title: string;
};

const TRACKED_PLATFORMS = new Set<SocialPlatformId>([
  "youtube",
  "discord",
  "twitch",
  "tiktok",
  "instagram",
  "twitter",
  "github",
  "roblox",
  "spotify",
]);

export function parseSocialLink(link: ProfileLink): ParsedSocialLink | null {
  if (isCustomLinkIcon(link.icon)) return null;

  const platformId = normalizeLinkIconKey(link.icon) as SocialPlatformId;
  if (!TRACKED_PLATFORMS.has(platformId)) return null;
  if (!getPlatform(platformId)) return null;

  try {
    new URL(link.url);
  } catch {
    return null;
  }

  return {
    linkId: link.id,
    platformId,
    url: link.url,
    title: link.title,
  };
}

export function extractPlatformUsername(url: string, platformId: SocialPlatformId): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);

    switch (platformId) {
      case "youtube": {
        if (parts[0] === "watch" || parts[0] === "playlist" || parts[0] === "shorts") return null;
        if (parts[0]?.startsWith("@")) return parts[0].slice(1);
        if (parts[0] === "channel" && parts[1]) return parts[1];
        if (parts[0] === "c" && parts[1]) return parts[1];
        if (parts[0] === "user" && parts[1]) return parts[1];
        // Plain /bamshy style paths — resolve via @handle fallback in scraper.
        if (parts[0] && !["feed", "gaming", "premium", "account", "results"].includes(parts[0])) {
          return parts[0];
        }
        return null;
      }
      case "discord": {
        if (parts[0] === "invite" && parts[1]) return parts[1];
        const invite = parts[0] ?? parsed.pathname.replace(/^\//, "");
        return invite.split("?")[0] || null;
      }
      case "roblox": {
        if (parts[0] === "users" && parts[1] && /^\d+$/.test(parts[1])) return parts[1];
        const username = parsed.searchParams.get("username");
        if (username) return username;
        return null;
      }
      case "spotify": {
        if ((parts[0] === "artist" || parts[0] === "user") && parts[1]) {
          return parts[1].split("?")[0] ?? null;
        }
        return null;
      }
      case "steam": {
        if (parts[0] === "id" && parts[1]) return parts[1];
        if (parts[0] === "profiles" && parts[1]) return parts[1];
        return parts[0] ?? null;
      }
      case "twitch":
      case "kick":
      case "github":
        return parts[0] ?? null;
      case "reddit":
        if (parts[0] === "u" && parts[1]) return parts[1];
        if (parts[0] === "user" && parts[1]) return parts[1];
        return parts[0] ?? null;
      case "tiktok":
        if (parts[0]?.startsWith("@")) return parts[0].slice(1);
        return parts[0] ?? null;
      case "instagram":
      case "twitter":
      case "facebook":
        return parts[0] ?? null;
      default:
        return parts[0] ?? null;
    }
  } catch {
    return null;
  }
}
