export type CardBorderEffectPreset =
  | "none"
  | "standard"
  | "neon-glow"
  | "snake"
  | "dual-snake"
  | "energy-flow"
  | "pulse"
  | "lightning"
  | "rgb-flow"
  | "white-aura"
  | "particle-trail"
  | "liquid-chrome"
  | "cyber-scan"
  | "fire"
  | "ice"
  | "void"
  | "aurora"
  | "plasma"
  | "gold-leaf"
  | "holographic"
  | "matrix"
  | "sunset"
  | "ocean-wave"
  | "toxic"
  | "blood-moon"
  | "diamond"
  | "nebula"
  | "laser"
  | "prism"
  | "strobe"
  | "ember"
  | "frostbite"
  | "shadow-pulse"
  | "candy"
  | "synthwave"
  | "arc-reactor"
  | "venom"
  | "celestial"
  | "magma"
  | "electric-surge"
  | "rose-gold";

export type CardBorderTarget =
  | "main"
  | "discord"
  | "roblox"
  | "spotify"
  | "links"
  | "guestbook";

export const CARD_BORDER_TARGETS: CardBorderTarget[] = [
  "main",
  "discord",
  "roblox",
  "spotify",
  "links",
  "guestbook",
];

export type CardBorderEffectConfig = {
  effect: CardBorderEffectPreset;
  thickness: number;
  speed: number;
  glowIntensity: number;
  color: string;
  secondaryColor: string;
  applyAll: boolean;
  targets: CardBorderTarget[];
};

export type ResolvedCardBorderEffect = {
  effect: CardBorderEffectPreset;
  showGlow: boolean;
  style: Record<string, string | number>;
};
