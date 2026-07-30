import type { CardBorderEffectPreset } from "@/lib/card-border-effects/types";

export type ProfileAvatarEffectPreset = CardBorderEffectPreset;

export type ProfileAvatarEffectOption = {
  value: ProfileAvatarEffectPreset;
  label: string;
  description: string;
  premiumOnly?: boolean;
};

export const PROFILE_AVATAR_EFFECT_OPTIONS: ProfileAvatarEffectOption[] = [
  { value: "none", label: "None", description: "Default accent ring only" },
  { value: "neon-glow", label: "Neon Glow", description: "Soft neon halo around your avatar", premiumOnly: true },
  { value: "snake", label: "Snake", description: "Light segment racing the ring", premiumOnly: true },
  { value: "dual-snake", label: "Dual Snake", description: "Two segments moving opposite ways", premiumOnly: true },
  { value: "pulse", label: "Pulse", description: "Ring slowly brightens and fades", premiumOnly: true },
  { value: "rgb-flow", label: "RGB Flow", description: "Animated rainbow gradient ring", premiumOnly: true },
  { value: "lightning", label: "Lightning", description: "Electric sparks around the edge", premiumOnly: true },
  { value: "fire", label: "Fire", description: "Animated flame border", premiumOnly: true },
  { value: "ice", label: "Ice", description: "Frost shimmer on the outline", premiumOnly: true },
  { value: "white-aura", label: "White Aura", description: "Clean white glow with slow drift", premiumOnly: true },
  { value: "energy-flow", label: "Energy Flow", description: "Shifting light energy on the ring", premiumOnly: true },
  { value: "liquid-chrome", label: "Liquid Chrome", description: "Metallic reflection traveling around", premiumOnly: true },
  { value: "cyber-scan", label: "Cyber Scan", description: "Scanning line around the circle", premiumOnly: true },
  { value: "particle-trail", label: "Particle Trail", description: "Tiny particles along the ring", premiumOnly: true },
  { value: "void", label: "Void", description: "Dark purple shadow energy", premiumOnly: true },
  { value: "aurora", label: "Aurora", description: "Northern lights sweep around the edge", premiumOnly: true },
  { value: "plasma", label: "Plasma", description: "Swirling pink and violet plasma", premiumOnly: true },
  { value: "gold-leaf", label: "Gold Leaf", description: "Luxury gold shimmer on the ring", premiumOnly: true },
  { value: "holographic", label: "Holographic", description: "Iridescent rainbow shift", premiumOnly: true },
  { value: "matrix", label: "Matrix", description: "Green digital code segments", premiumOnly: true },
  { value: "sunset", label: "Sunset", description: "Warm orange and pink horizon glow", premiumOnly: true },
  { value: "ocean-wave", label: "Ocean Wave", description: "Deep blue tidal energy", premiumOnly: true },
  { value: "toxic", label: "Toxic", description: "Neon green radioactive pulse", premiumOnly: true },
  { value: "blood-moon", label: "Blood Moon", description: "Crimson lunar eclipse aura", premiumOnly: true },
  { value: "diamond", label: "Diamond", description: "Sharp white sparkle facets", premiumOnly: true },
  { value: "nebula", label: "Nebula", description: "Cosmic purple and pink cloud drift", premiumOnly: true },
  { value: "laser", label: "Laser", description: "High-intensity red beam sweep", premiumOnly: true },
  { value: "prism", label: "Prism", description: "Split rainbow light beams", premiumOnly: true },
  { value: "synthwave", label: "Synthwave", description: "Retro 80s purple and magenta glow", premiumOnly: true },
  { value: "arc-reactor", label: "Arc Reactor", description: "Cyan core pulse with electric ring", premiumOnly: true },
  { value: "celestial", label: "Celestial", description: "Golden starlight trail", premiumOnly: true },
  { value: "rose-gold", label: "Rose Gold", description: "Soft rose-gold metallic reflection", premiumOnly: true },
  { value: "venom", label: "Venom", description: "Black and toxic green tendril energy", premiumOnly: true },
  { value: "magma", label: "Magma", description: "Cracked lava veins with heat flicker", premiumOnly: true },
  { value: "electric-surge", label: "Electric Surge", description: "Bright blue voltage racing the ring", premiumOnly: true },
  { value: "frostbite", label: "Frostbite", description: "Icy white-blue crystalline shimmer", premiumOnly: true },
  { value: "shadow-pulse", label: "Shadow Pulse", description: "Dark energy breathing on the edge", premiumOnly: true },
  { value: "candy", label: "Candy Pop", description: "Hot pink and cyan stripe burst", premiumOnly: true },
  { value: "ember", label: "Ember", description: "Slow-burning warm coal glow", premiumOnly: true },
  { value: "strobe", label: "Strobe", description: "Rapid white flash segments", premiumOnly: true },
];

export const PROFILE_AVATAR_EFFECT_PRESETS = new Set(
  PROFILE_AVATAR_EFFECT_OPTIONS.map((option) => option.value),
);
