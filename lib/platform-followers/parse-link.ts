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
  "kick",
  "reddit",
  "facebook",
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
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const parts = parsed.pathname.split("/").filter(Boolean);

    switch (platformId) {
      case "youtube": {
        if (parts[0]?.startsWith("@")) return parts[0].slice(1);
        if (parts[0] === "channel" && parts[1]) return parts[1];
        if (parts[0] === "c" && parts[1]) return parts[1];
        if (parts[0] === "user" && parts[1]) return parts[1];
        return parts[0] ?? null;
      }
      case "discord": {
        const invite = parts[0] ?? parsed.pathname.replace(/^\//, "");
        return invite || null;
      }
      case "twitch":
      case "kick":
      case "github":
      case "reddit":
        if (platformId === "reddit" && parts[0] === "u" && parts[1]) return parts[1];
        if (platformId === "reddit" && parts[0] === "user" && parts[1]) return parts[1];
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
