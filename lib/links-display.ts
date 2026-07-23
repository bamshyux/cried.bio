import type { CSSProperties } from "react";
import type { ProfileLink } from "@/lib/types/link";
import type { LinksButtonStyle, LinksSpacing, ProfileSettings } from "@/lib/types/settings";

export function resolveLinksBorderRadius(settings: ProfileSettings): number {
  if (settings.links_border_radius > 0) return settings.links_border_radius;
  return settings.border_radius;
}

export function getLinksSpacingClass(spacing: LinksSpacing): {
  stack: string;
  row: string;
} {
  switch (spacing) {
    case "compact":
      return { stack: "space-y-1.5", row: "gap-1.5" };
    case "relaxed":
      return { stack: "space-y-3", row: "gap-3" };
    default:
      return { stack: "space-y-2", row: "gap-2" };
  }
}

function parseRgbaAlpha(color: string): number | null {
  const match = color.match(/rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/i);
  if (!match) return null;
  const alpha = parseFloat(match[1] ?? "");
  return Number.isFinite(alpha) ? alpha : null;
}

function applyOpacityToBackground(color: string, opacityPercent: number): string {
  const factor = Math.min(100, Math.max(0, opacityPercent)) / 100;
  const alpha = parseRgbaAlpha(color);
  if (alpha != null) {
    return color.replace(/,\s*[\d.]+\s*\)/, `, ${(alpha * factor).toFixed(3)})`);
  }
  return `rgba(255, 255, 255, ${(0.06 * factor).toFixed(3)})`;
}

export function resolveLinkButtonAppearance(
  settings: ProfileSettings,
  link: ProfileLink,
  featured = false,
): {
  backgroundColor: string | undefined;
  borderColor: string | undefined;
  borderWidth: string | undefined;
  color: string;
  borderRadius: number;
  showBorder: boolean;
} {
  const borderRadius = resolveLinksBorderRadius(settings);
  const color = link.color ?? settings.text_color;
  const accent = settings.accent_color;
  const style: LinksButtonStyle = settings.links_button_style ?? "filled";

  if (featured) {
    return {
      backgroundColor: `${accent}0f`,
      borderColor: `${accent}4d`,
      borderWidth: "1px",
      color,
      borderRadius,
      showBorder: true,
    };
  }

  if (style === "ghost") {
    return {
      backgroundColor: "transparent",
      borderColor: "transparent",
      borderWidth: "0",
      color,
      borderRadius,
      showBorder: false,
    };
  }

  if (style === "outline") {
    return {
      backgroundColor: "transparent",
      borderColor: `${accent}33`,
      borderWidth: "1px",
      color,
      borderRadius,
      showBorder: true,
    };
  }

  const baseBg = link.background_color?.trim() || "rgba(255,255,255,0.05)";
  return {
    backgroundColor: applyOpacityToBackground(baseBg, settings.links_button_opacity ?? 100),
    borderColor: `${accent}15`,
    borderWidth: "1px",
    color,
    borderRadius,
    showBorder: true,
  };
}

export function resolveIconBoxAppearance(settings: ProfileSettings): {
  className: string;
  style: CSSProperties;
} {
  const style = settings.links_button_style ?? "filled";
  const accent = settings.accent_color;
  const opacity = (settings.links_button_opacity ?? 100) / 100;

  if (style === "ghost") {
    return {
      className: "border-transparent bg-transparent hover:bg-white/[0.04]",
      style: {},
    };
  }

  if (style === "outline") {
    return {
      className: "hover:border-[var(--bf-accent,#fafafa)]/30 hover:bg-[var(--bf-accent,#fafafa)]/[0.04]",
      style: {
        borderColor: `${accent}28`,
        backgroundColor: "transparent",
      },
    };
  }

  return {
    className: "border-white/[0.06] hover:border-[var(--bf-accent,#fafafa)]/30 hover:bg-[var(--bf-accent,#fafafa)]/[0.06]",
    style: {
      backgroundColor: `rgba(255, 255, 255, ${(0.03 * opacity).toFixed(3)})`,
    },
  };
}
