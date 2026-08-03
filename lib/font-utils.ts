import { PREMIUM_FONT_OPTIONS } from "@/lib/premium/fonts";
import { FONT_OPTIONS, type FontOption } from "@/lib/settings";

const ALL_FONT_OPTIONS: FontOption[] = [...FONT_OPTIONS, ...PREMIUM_FONT_OPTIONS];

export function getFontOption(fontKey: string): FontOption | undefined {
  return ALL_FONT_OPTIONS.find((font) => font.value === fontKey);
}

export function getFontCss(fontKey: string) {
  return getFontOption(fontKey)?.css ?? FONT_OPTIONS[0].css;
}

export function getFontLabel(fontKey: string) {
  return getFontOption(fontKey)?.label ?? fontKey;
}

export function isDisplayFont(fontKey: string): boolean {
  return getFontOption(fontKey)?.selectGroup === "Premium · Display";
}

/** Stylesheet URL for Google Fonts or Fontshare; null for bundled/system fonts. */
export function getFontStylesheetUrl(fontKey: string): string | null {
  const option = getFontOption(fontKey);
  if (!option) return null;
  if (option.google) {
    return `https://fonts.googleapis.com/css2?family=${option.google}&display=swap`;
  }
  if (option.fontshare) {
    return `https://api.fontshare.com/v2/css?f[]=${encodeURIComponent(option.fontshare)}&display=swap`;
  }
  return null;
}

/** @deprecated Use getFontStylesheetUrl — kept for existing call sites. */
export function getGoogleFontsUrl(fontKey: string) {
  return getFontStylesheetUrl(fontKey);
}

export function buildFontSelectOptions(options?: { canUsePremiumFonts?: boolean }) {
  const canUsePremiumFonts = options?.canUsePremiumFonts ?? false;

  return [
    ...FONT_OPTIONS.map((font) => ({
      value: font.value,
      label: font.label,
      group: "Standard",
    })),
    ...PREMIUM_FONT_OPTIONS.map((font) => ({
      value: font.value,
      label: canUsePremiumFonts ? font.label : `${font.label} (Premium)`,
      group: font.selectGroup ?? "Premium",
    })),
  ];
}
