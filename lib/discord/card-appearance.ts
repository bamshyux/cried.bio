import type { CSSProperties } from "react";
import type { DiscordCardConfig, DiscordCardRadius, DiscordCardWidth } from "@/lib/types/discord-widget";

export type ResolvedDiscordCardAppearance = {
  shellClass: string;
  shellStyle: CSSProperties;
  shellOverflowClass: string;
  maxWidthClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
  activityShellClass: string;
  activityWrapClass: string;
  activityImageSize: string;
  statusBorderClass: string;
  accentColor: string;
  hintBorderClass: string;
  avatarSize: string;
  headerPadding: string;
  isCompact: boolean;
  isPill: boolean;
};

function radiusClass(radius: DiscordCardRadius, pillWithActivity: boolean) {
  if (pillWithActivity) return "rounded-3xl";
  switch (radius) {
    case "sharp":
      return "rounded-none";
    case "round":
      return "rounded-2xl";
    case "pill":
      return "rounded-full";
    default:
      return "rounded-lg";
  }
}

function widthClass(width: DiscordCardWidth) {
  switch (width) {
    case "narrow":
      return "max-w-[240px]";
    case "wide":
      return "max-w-[420px]";
    case "full":
      return "max-w-full";
    default:
      return "max-w-[320px]";
  }
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function resolveDiscordCardAppearance(
  config: DiscordCardConfig,
  profileAccent = "#5865F2",
  options?: { hasActivity?: boolean },
): ResolvedDiscordCardAppearance {
  const hasActivity = options?.hasActivity === true;
  const themeAccent =
    config.accent_color ||
    (config.theme === "accent" ? profileAccent : "#5865F2");

  const baseBg =
    config.background_color ||
    (config.theme === "midnight"
      ? "#0a0a0c"
      : config.theme === "glass"
        ? "#000000"
        : "#2b2d31");

  const opacity = config.background_opacity / 100;
  const bgColor =
    config.theme === "glass"
      ? hexToRgba(baseBg, Math.min(opacity, 0.45))
      : hexToRgba(baseBg, opacity);

  const borderColor =
    config.border_color ||
    (config.theme === "neon"
      ? themeAccent
      : config.theme === "glass"
        ? "rgba(255,255,255,0.12)"
        : "#1e1f22");

  const borderWidth = config.border_width;
  const radius = config.style === "pill" ? "pill" : config.border_radius;
  const glowShadow = config.glow
    ? `0 0 24px ${hexToRgba(themeAccent, 0.35)}, 0 8px 24px rgba(0,0,0,0.3)`
    : config.theme === "neon"
      ? `0 0 16px ${hexToRgba(themeAccent, 0.25)}`
      : "0 8px 16px rgba(0,0,0,0.24)";

  const minimal = config.style === "minimal";
  const compact = config.style === "compact";
  const pill = config.style === "pill";
  const pillWithActivity = pill && hasActivity;

  return {
    shellClass: [
      radiusClass(radius, pillWithActivity),
      config.backdrop_blur || config.theme === "glass" ? "backdrop-blur-md" : "",
      minimal ? "border border-white/10 shadow-none" : "",
    ]
      .filter(Boolean)
      .join(" "),
    shellOverflowClass: pillWithActivity ? "overflow-visible" : "overflow-hidden",
    shellStyle: {
      backgroundColor: minimal ? hexToRgba("#000000", Math.min(opacity, 0.4)) : bgColor,
      borderWidth: minimal ? undefined : borderWidth,
      borderStyle: borderWidth > 0 ? "solid" : undefined,
      borderColor: minimal ? undefined : borderColor,
      boxShadow: minimal ? undefined : glowShadow,
    },
    maxWidthClass: widthClass(config.card_width),
    textPrimaryClass: minimal || config.theme === "glass" ? "text-white" : "text-[#f2f3f5]",
    textSecondaryClass:
      minimal || config.theme === "glass" ? "text-neutral-400" : "text-[#b5bac1]",
    activityShellClass:
      pillWithActivity
        ? config.theme === "glass"
          ? "rounded-2xl border border-white/10 bg-white/5 p-2.5"
          : "rounded-2xl bg-[#1e1f22] p-2.5"
        : config.theme === "glass"
          ? "rounded-md border border-white/10 bg-white/5 p-2.5"
          : "rounded-md bg-[#1e1f22] p-2.5",
    activityWrapClass: pillWithActivity ? "px-3 pb-3 pt-0" : "mx-3 mb-3",
    activityImageSize: pillWithActivity ? "h-12 w-12" : "h-[60px] w-[60px]",
    statusBorderClass:
      minimal || config.theme === "glass" ? "border-white/10" : "border-[#2b2d31]",
    hintBorderClass:
      minimal || config.theme === "glass" ? "border-white/10" : "border-[#1e1f22]",
    accentColor: themeAccent,
    avatarSize: compact || pill ? "h-8 w-8" : "h-10 w-10",
    headerPadding: compact || pill ? "py-2" : "py-3",
    isCompact: compact,
    isPill: pill,
  };
}