import type { FontOption } from "@/lib/settings";

/** Premium-only fonts — not selectable by free users */
export const PREMIUM_FONT_OPTIONS: FontOption[] = [
  {
    value: "cormorant-garamond",
    label: "Cormorant Garamond",
    css: "'Cormorant Garamond', serif",
    google: "Cormorant+Garamond:wght@400;500;600;700",
  },
  {
    value: "cinzel",
    label: "Cinzel",
    css: "'Cinzel', serif",
    google: "Cinzel:wght@400;500;600;700",
  },
  {
    value: "bodoni-moda",
    label: "Bodoni Moda",
    css: "'Bodoni Moda', serif",
    google: "Bodoni+Moda:wght@400;500;600;700",
  },
  {
    value: "unbounded",
    label: "Unbounded",
    css: "'Unbounded', sans-serif",
    google: "Unbounded:wght@400;500;600;700",
  },
  {
    value: "clash-display",
    label: "Clash Display",
    css: "'Clash Display', sans-serif",
    google: "Clash+Display:wght@400;500;600;700",
  },
  {
    value: "satoshi",
    label: "Satoshi",
    css: "'Satoshi', sans-serif",
  },
  {
    value: "general-sans",
    label: "General Sans",
    css: "'General Sans', sans-serif",
  },
  {
    value: "chillax",
    label: "Chillax",
    css: "'Chillax', sans-serif",
  },
];

export const PREMIUM_FONT_VALUES = new Set(PREMIUM_FONT_OPTIONS.map((f) => f.value));

export function isPremiumFont(fontKey: string): boolean {
  return PREMIUM_FONT_VALUES.has(fontKey);
}
