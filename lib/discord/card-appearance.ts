import type { CSSProperties } from "react";
import { FONT_OPTIONS } from "@/lib/settings";
import type {
  DiscordAvatarShape,
  DiscordAvatarSize,
  DiscordCardConfig,
  DiscordCardRadius,
  DiscordCardWidth,
  DiscordHeaderLayout,
  DiscordTextAlign,
} from "@/lib/types/discord-widget";

export type ResolvedDiscordCardAppearance = {
  shellClass: string;
  shellStyle: CSSProperties;
  shellOverflowClass: string;
  maxWidthClass: string;
  cardAlignClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
  primaryTextStyle: CSSProperties;
  secondaryTextStyle: CSSProperties;
  cardFontStyle: CSSProperties;
  activityShellClass: string;
  activityWrapClass: string;
  activityImageSize: string;
  statusBorderClass: string;
  accentColor: string;
  hintBorderClass: string;
  avatarSize: string;
  avatarShapeClass: string;
  headerStyle: CSSProperties;
  headerClass: string;
  headerRowClass: string;
  headerTextClass: string;
  nameStyle: CSSProperties;
  statusStyle: CSSProperties;
  dataAttributes: {
    headerLayout: DiscordHeaderLayout;
    textAlign: DiscordTextAlign;
    cardAlign: DiscordCardConfig["card_align"];
  };
  isCompact: boolean;
  isPill: boolean;
};

function isRowTextOverlay(
  config: Pick<DiscordCardConfig, "header_layout" | "text_align">,
): boolean {
  return (
    config.header_layout === "row" &&
    (config.text_align === "center" || config.text_align === "right")
  );
}

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

/** Pixel radius for card border effects — matches Tailwind classes on the Discord shell. */
export function resolveDiscordCardBorderRadiusPx(
  config: DiscordCardConfig,
  options?: { hasActivity?: boolean },
): number {
  const hasActivity = options?.hasActivity === true;
  const pillWithActivity = config.style === "pill" && hasActivity;
  if (pillWithActivity) return 24;

  const radius = config.style === "pill" ? "pill" : config.border_radius;
  switch (radius) {
    case "sharp":
      return 0;
    case "round":
      return 16;
    case "pill":
      return 9999;
    default:
      return 8;
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

function cardAlignClass(cardAlign: DiscordCardConfig["card_align"]) {
  switch (cardAlign) {
    case "left":
      return "mr-auto ml-0";
    case "center":
      return "mx-auto";
    case "right":
      return "ml-auto mr-0";
    default:
      return "";
  }
}

function avatarSizeClass(size: DiscordAvatarSize, compact: boolean, pill: boolean) {
  switch (size) {
    case "small":
      return "h-7 w-7";
    case "large":
      return "h-12 w-12";
    case "xlarge":
      return "h-16 w-16";
    case "medium":
    default:
      return compact || pill ? "h-8 w-8" : "h-10 w-10";
  }
}

function avatarShapeClass(shape: DiscordAvatarShape) {
  switch (shape) {
    case "rounded":
      return "rounded-lg";
    case "square":
      return "rounded-none";
    default:
      return "rounded-full";
  }
}

function resolveFontFamily(fontKey: string): string | undefined {
  if (!fontKey) return undefined;
  const option = FONT_OPTIONS.find((entry) => entry.value === fontKey);
  return option?.css;
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

  const defaultPrimaryClass = minimal || config.theme === "glass" ? "text-white" : "text-[#f2f3f5]";
  const defaultSecondaryClass =
    minimal || config.theme === "glass" ? "text-neutral-400" : "text-[#b5bac1]";

  const defaultNameSize = compact || pill ? 14 : 15;
  const defaultStatusSize = compact || pill ? 12 : 14;
  const paddingY = config.padding_y > 0 ? config.padding_y : compact || pill ? 8 : 12;
  const fontFamily = resolveFontFamily(config.font_family);
  const rowTextOverlay = isRowTextOverlay(config);

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
      fontFamily,
    },
    maxWidthClass: widthClass(config.card_width),
    cardAlignClass: cardAlignClass(config.card_align),
    textPrimaryClass: config.primary_text_color ? "" : defaultPrimaryClass,
    textSecondaryClass: config.secondary_text_color ? "" : defaultSecondaryClass,
    primaryTextStyle: config.primary_text_color ? { color: config.primary_text_color } : {},
    secondaryTextStyle: config.secondary_text_color ? { color: config.secondary_text_color } : {},
    cardFontStyle: fontFamily ? { fontFamily } : {},
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
    avatarSize: avatarSizeClass(config.avatar_size, compact, pill),
    avatarShapeClass: avatarShapeClass(config.avatar_shape),
    headerStyle: {
      gap: config.header_gap,
      paddingLeft: config.padding_x,
      paddingRight: config.padding_x,
      paddingTop: paddingY,
      paddingBottom: paddingY,
    },
    headerClass: pill ? "pr-4" : "",
    headerRowClass: rowTextOverlay
      ? "profile-discord-status__header--text-overlay"
      : "flex",
    headerTextClass:
      config.header_layout === "centered"
        ? "profile-discord-status__header-text profile-discord-status__header-text--centered w-full flex-none"
        : rowTextOverlay
          ? "profile-discord-status__header-text"
          : "profile-discord-status__header-text min-w-0 flex-1",
    nameStyle: config.name_font_size > 0 ? { fontSize: config.name_font_size } : { fontSize: defaultNameSize },
    statusStyle:
      config.status_font_size > 0 ? { fontSize: config.status_font_size } : { fontSize: defaultStatusSize },
    dataAttributes: {
      headerLayout: config.header_layout,
      textAlign: config.text_align,
      cardAlign: config.card_align,
    },
    isCompact: compact,
    isPill: pill,
  };
}
