import type { CSSProperties } from "react";
import { getFontCss } from "@/lib/settings";
import type { BioLetterSpacing, ProfileSettings } from "@/lib/types/settings";

export function clampBioFontSize(value: number) {
  if (!Number.isFinite(value)) return 16;
  return Math.min(32, Math.max(12, Math.round(value)));
}

export function resolveBioColor(settings: ProfileSettings) {
  const custom = settings.bio_color?.trim();
  if (custom) return custom;
  return settings.text_color?.trim() || "#fafafa";
}

export function resolveBioFontFamily(settings: ProfileSettings) {
  const custom = settings.bio_font_family?.trim();
  return getFontCss(custom || settings.font_family);
}

export function resolveBioLetterSpacing(spacing: BioLetterSpacing) {
  switch (spacing) {
    case "wide":
      return "0.06em";
    case "wider":
      return "0.12em";
    default:
      return undefined;
  }
}

export function resolveBioStyle(settings: ProfileSettings): CSSProperties {
  const color = resolveBioColor(settings);
  const style: CSSProperties = {
    color,
    fontFamily: resolveBioFontFamily(settings),
    fontSize: `${clampBioFontSize(settings.bio_font_size)}px`,
    fontWeight: settings.bio_font_weight || 400,
    fontStyle: settings.bio_italic ? "italic" : "normal",
    letterSpacing: resolveBioLetterSpacing(settings.bio_letter_spacing),
  };

  if (settings.bio_glow) {
    style.textShadow = `0 0 14px ${color}99, 0 0 28px ${settings.accent_color}55`;
  }

  return style;
}
