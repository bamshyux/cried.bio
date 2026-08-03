import type { FontOption } from "@/lib/settings";

const DISPLAY = "Premium · Display";
const ELEGANT = "Premium · Elegant";
const MODERN = "Premium · Modern";

/** Premium-only fonts — not selectable by free users */
export const PREMIUM_FONT_OPTIONS: FontOption[] = [
  // Display — grunge, drip, horror, graffiti
  {
    value: "nosifer",
    label: "Nosifer",
    css: "'Nosifer', cursive",
    google: "Nosifer",
    selectGroup: DISPLAY,
  },
  {
    value: "butcherman",
    label: "Butcherman",
    css: "'Butcherman', cursive",
    google: "Butcherman",
    selectGroup: DISPLAY,
  },
  {
    value: "rubik-wet-paint",
    label: "Rubik Wet Paint",
    css: "'Rubik Wet Paint', cursive",
    google: "Rubik+Wet+Paint",
    selectGroup: DISPLAY,
  },
  {
    value: "rubik-spray-paint",
    label: "Rubik Spray Paint",
    css: "'Rubik Spray Paint', cursive",
    google: "Rubik+Spray+Paint",
    selectGroup: DISPLAY,
  },
  {
    value: "rock-salt",
    label: "Rock Salt",
    css: "'Rock Salt', cursive",
    google: "Rock+Salt",
    selectGroup: DISPLAY,
  },
  {
    value: "caesar-dressing",
    label: "Caesar Dressing",
    css: "'Caesar Dressing', cursive",
    google: "Caesar+Dressing",
    selectGroup: DISPLAY,
  },
  {
    value: "creepster",
    label: "Creepster",
    css: "'Creepster', cursive",
    google: "Creepster",
    selectGroup: DISPLAY,
  },
  {
    value: "eater",
    label: "Eater",
    css: "'Eater', cursive",
    google: "Eater",
    selectGroup: DISPLAY,
  },
  {
    value: "vampiro-one",
    label: "Vampiro One",
    css: "'Vampiro One', cursive",
    google: "Vampiro+One",
    selectGroup: DISPLAY,
  },
  {
    value: "wallpoet",
    label: "Wallpoet",
    css: "'Wallpoet', cursive",
    google: "Wallpoet",
    selectGroup: DISPLAY,
  },
  {
    value: "rubik-glitch",
    label: "Rubik Glitch",
    css: "'Rubik Glitch', cursive",
    google: "Rubik+Glitch",
    selectGroup: DISPLAY,
  },
  {
    value: "knewave",
    label: "Knewave",
    css: "'Knewave', cursive",
    google: "Knewave",
    selectGroup: DISPLAY,
  },
  {
    value: "metal-mania",
    label: "Metal Mania",
    css: "'Metal Mania', cursive",
    google: "Metal+Mania",
    selectGroup: DISPLAY,
  },
  {
    value: "new-rocker",
    label: "New Rocker",
    css: "'New Rocker', cursive",
    google: "New+Rocker",
    selectGroup: DISPLAY,
  },
  {
    value: "londrina-shadow",
    label: "Londrina Shadow",
    css: "'Londrina Shadow', cursive",
    google: "Londrina+Shadow",
    selectGroup: DISPLAY,
  },
  {
    value: "shrikhand",
    label: "Shrikhand",
    css: "'Shrikhand', cursive",
    google: "Shrikhand",
    selectGroup: DISPLAY,
  },
  {
    value: "monoton",
    label: "Monoton",
    css: "'Monoton', cursive",
    google: "Monoton",
    selectGroup: DISPLAY,
  },
  {
    value: "pirata-one",
    label: "Pirata One",
    css: "'Pirata One', cursive",
    google: "Pirata+One",
    selectGroup: DISPLAY,
  },
  {
    value: "rubik-moonrocks",
    label: "Rubik Moonrocks",
    css: "'Rubik Moonrocks', cursive",
    google: "Rubik+Moonrocks",
    selectGroup: DISPLAY,
  },
  {
    value: "rubik-puddles",
    label: "Rubik Puddles",
    css: "'Rubik Puddles', cursive",
    google: "Rubik+Puddles",
    selectGroup: DISPLAY,
  },

  // Elegant — luxury serif
  {
    value: "cormorant-garamond",
    label: "Cormorant Garamond",
    css: "'Cormorant Garamond', serif",
    google: "Cormorant+Garamond:wght@400;500;600;700",
    selectGroup: ELEGANT,
  },
  {
    value: "cinzel",
    label: "Cinzel",
    css: "'Cinzel', serif",
    google: "Cinzel:wght@400;500;600;700",
    selectGroup: ELEGANT,
  },
  {
    value: "bodoni-moda",
    label: "Bodoni Moda",
    css: "'Bodoni Moda', serif",
    google: "Bodoni+Moda:wght@400;500;600;700",
    selectGroup: ELEGANT,
  },

  // Modern — clean premium sans
  {
    value: "unbounded",
    label: "Unbounded",
    css: "'Unbounded', sans-serif",
    google: "Unbounded:wght@400;500;600;700",
    selectGroup: MODERN,
  },
  {
    value: "clash-display",
    label: "Clash Display",
    css: "'Clash Display', sans-serif",
    fontshare: "clash-display@400,500,600,700",
    selectGroup: MODERN,
  },
  {
    value: "satoshi",
    label: "Satoshi",
    css: "'Satoshi', sans-serif",
    fontshare: "satoshi@400,500,600,700",
    selectGroup: MODERN,
  },
  {
    value: "general-sans",
    label: "General Sans",
    css: "'General Sans', sans-serif",
    fontshare: "general-sans@400,500,600,700",
    selectGroup: MODERN,
  },
  {
    value: "chillax",
    label: "Chillax",
    css: "'Chillax', sans-serif",
    fontshare: "chillax@400,500,600,700",
    selectGroup: MODERN,
  },
];

export const PREMIUM_FONT_VALUES = new Set(PREMIUM_FONT_OPTIONS.map((f) => f.value));

export function isPremiumFont(fontKey: string): boolean {
  return PREMIUM_FONT_VALUES.has(fontKey);
}
