import type { CardBorderEffectPreset, CardBorderTarget } from "@/lib/card-border-effects/types";

export type CardBorderEffectOption = {
  value: CardBorderEffectPreset;
  label: string;
  description: string;
  premiumOnly?: boolean;
};

export const FREE_CARD_BORDER_EFFECT_OPTIONS: CardBorderEffectOption[] = [
  { value: "none", label: "None", description: "No border effect" },
  { value: "standard", label: "Standard border", description: "Clean static outline" },
  { value: "neon-glow", label: "Neon Glow", description: "Soft glow wrapping the border" },
  { value: "snake", label: "Snake", description: "Light segment traveling the outline" },
  { value: "dual-snake", label: "Dual Snake", description: "Two segments moving opposite ways" },
  { value: "energy-flow", label: "Energy Flow", description: "Shifting light energy on the border" },
  { value: "pulse", label: "Pulse", description: "Border slowly brightens and fades" },
  { value: "lightning", label: "Lightning", description: "Electric sparks around the edges" },
  { value: "rgb-flow", label: "RGB Flow", description: "Animated gradient around the border" },
  { value: "white-aura", label: "White Aura", description: "Premium white glow with slow drift" },
  { value: "particle-trail", label: "Particle Trail", description: "Tiny particles along the border path" },
  { value: "liquid-chrome", label: "Liquid Chrome", description: "Metallic reflection moving around" },
  { value: "cyber-scan", label: "Cyber Scan", description: "Scanning line around the perimeter" },
  { value: "fire", label: "Fire", description: "Animated flame border" },
  { value: "ice", label: "Ice", description: "Frost energy border" },
  { value: "void", label: "Void", description: "Dark purple shadow energy" },
];

export const PREMIUM_CARD_BORDER_EFFECT_OPTIONS: CardBorderEffectOption[] = [
  { value: "aurora", label: "Aurora", description: "Northern lights sweep around the edge", premiumOnly: true },
  { value: "plasma", label: "Plasma", description: "Swirling pink and violet plasma energy", premiumOnly: true },
  { value: "gold-leaf", label: "Gold Leaf", description: "Luxury gold shimmer traveling the border", premiumOnly: true },
  { value: "holographic", label: "Holographic", description: "Iridescent rainbow shift on the outline", premiumOnly: true },
  { value: "matrix", label: "Matrix", description: "Green digital code segments", premiumOnly: true },
  { value: "sunset", label: "Sunset", description: "Warm orange and pink horizon glow", premiumOnly: true },
  { value: "ocean-wave", label: "Ocean Wave", description: "Deep blue tidal energy around the card", premiumOnly: true },
  { value: "toxic", label: "Toxic", description: "Neon green radioactive pulse", premiumOnly: true },
  { value: "blood-moon", label: "Blood Moon", description: "Crimson lunar eclipse aura", premiumOnly: true },
  { value: "diamond", label: "Diamond", description: "Sharp white sparkle facets", premiumOnly: true },
  { value: "nebula", label: "Nebula", description: "Cosmic purple and pink cloud drift", premiumOnly: true },
  { value: "laser", label: "Laser", description: "High-intensity red beam sweep", premiumOnly: true },
  { value: "prism", label: "Prism", description: "Split rainbow light beams", premiumOnly: true },
  { value: "strobe", label: "Strobe", description: "Rapid white flash segments", premiumOnly: true },
  { value: "ember", label: "Ember", description: "Slow-burning warm coal glow", premiumOnly: true },
  { value: "frostbite", label: "Frostbite", description: "Icy white-blue crystalline shimmer", premiumOnly: true },
  { value: "shadow-pulse", label: "Shadow Pulse", description: "Dark energy breathing on the edge", premiumOnly: true },
  { value: "candy", label: "Candy Pop", description: "Hot pink and cyan stripe burst", premiumOnly: true },
  { value: "synthwave", label: "Synthwave", description: "Retro 80s purple and magenta grid glow", premiumOnly: true },
  { value: "arc-reactor", label: "Arc Reactor", description: "Cyan core pulse with electric ring", premiumOnly: true },
  { value: "venom", label: "Venom", description: "Black and toxic green tendril energy", premiumOnly: true },
  { value: "celestial", label: "Celestial", description: "Golden starlight trail around the card", premiumOnly: true },
  { value: "magma", label: "Magma", description: "Cracked lava veins with heat flicker", premiumOnly: true },
  { value: "electric-surge", label: "Electric Surge", description: "Bright blue voltage racing the outline", premiumOnly: true },
  { value: "rose-gold", label: "Rose Gold", description: "Soft rose-gold metallic reflection", premiumOnly: true },
];

export const CARD_BORDER_EFFECT_OPTIONS: CardBorderEffectOption[] = [
  ...FREE_CARD_BORDER_EFFECT_OPTIONS,
  ...PREMIUM_CARD_BORDER_EFFECT_OPTIONS,
];

export const CARD_BORDER_TARGET_OPTIONS: {
  value: CardBorderTarget;
  label: string;
}[] = [
  { value: "main", label: "Main profile card" },
  { value: "discord", label: "Discord widget" },
  { value: "roblox", label: "Roblox embed" },
  { value: "spotify", label: "Spotify card" },
  { value: "links", label: "Link cards" },
  { value: "guestbook", label: "Guestbook" },
];
