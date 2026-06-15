import type { SocialPlatformId } from "@/lib/social-platforms";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";
import {
  SiDiscord,
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiKick,
  SiReddit,
  SiRoblox,
  SiSpotify,
  SiSteam,
  SiTelegram,
  SiTiktok,
  SiTwitch,
  SiX,
  SiYoutube,
} from "react-icons/si";
import { LuLink } from "react-icons/lu";
import type { IconType } from "react-icons";

const PLATFORM_ICONS: Record<string, IconType> = {
  youtube: SiYoutube,
  discord: SiDiscord,
  twitch: SiTwitch,
  tiktok: SiTiktok,
  instagram: SiInstagram,
  twitter: SiX,
  github: SiGithub,
  spotify: SiSpotify,
  steam: SiSteam,
  roblox: SiRoblox,
  kick: SiKick,
  telegram: SiTelegram,
  facebook: SiFacebook,
  reddit: SiReddit,
  link: LuLink,
  custom: LuLink,
};

/** Official / brand colors for social platforms */
export const PLATFORM_BRAND_COLORS: Record<string, string> = {
  youtube: "#FF0000",
  discord: "#5865F2",
  twitch: "#9146FF",
  tiktok: "#EE1D52",
  instagram: "#E4405F",
  twitter: "#FFFFFF",
  github: "#F0F6FC",
  spotify: "#1DB954",
  steam: "#66C0F4",
  roblox: "#E2231A",
  kick: "#53FC18",
  telegram: "#26A5E4",
  facebook: "#1877F2",
  reddit: "#FF4500",
  link: "#A3A3A3",
  custom: "#A3A3A3",
};

export function getPlatformBrandColor(platform: string): string {
  return PLATFORM_BRAND_COLORS[platform] ?? PLATFORM_BRAND_COLORS.link;
}

export function LinkIcon({
  platform,
  size = 20,
  monochrome = false,
  monoColor,
}: {
  platform: string;
  size?: number;
  /** When true, uses monoColor instead of brand color */
  monochrome?: boolean;
  monoColor?: string;
}) {
  const Icon = PLATFORM_ICONS[platform] ?? LuLink;
  const color = monochrome && monoColor ? monoColor : getPlatformBrandColor(platform);

  return (
    <span className="inline-flex shrink-0 items-center justify-center" style={{ color }}>
      <Icon size={size} aria-hidden />
    </span>
  );
}

export function PlatformIconGrid({
  onSelect,
}: {
  onSelect: (id: SocialPlatformId) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {SOCIAL_PLATFORMS.map((platform) => (
        <button
          key={platform.id}
          type="button"
          onClick={() => onSelect(platform.id)}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-3 transition-colors hover:border-[#00e5cc]/30 hover:bg-[#141414]"
        >
          <LinkIcon platform={platform.id} size={18} />
          <span className="text-[10px] text-neutral-500">{platform.name}</span>
        </button>
      ))}
    </div>
  );
}
