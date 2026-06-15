/** Scalloped seal shape + color helpers for Discord-style badges */

export function buildScallopPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  teeth = 12,
): string {
  const segments = teeth * 2;
  const parts: string[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `${parts.join(" ")} Z`;
}

export const SEAL_SHAPE = buildScallopPath(24, 24, 22.2, 19.4, 12);

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6) return { r: 59, g: 130, b: 246 };
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return { r: 59, g: 130, b: 246 };
  return { r, g, b };
}

export function rgbString(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

function clamp(n: number) {
  return Math.min(255, Math.max(0, Math.round(n)));
}

export function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `#${[r + amount, g + amount, b + amount].map((c) => clamp(c).toString(16).padStart(2, "0")).join("")}`;
}

export function darken(hex: string, amount: number): string {
  return lighten(hex, -amount);
}

export function buildBadgeGlowFilter(
  color: string,
  size: number,
  options?: { enabled?: boolean; hovered?: boolean; featured?: boolean; monochrome?: boolean },
): string {
  if (options?.enabled === false) return "none";

  const hovered = options?.hovered ?? false;
  const featured = options?.featured ?? false;
  const rgb = options?.monochrome ? "228, 228, 231" : rgbString(color);
  const base = featured ? 0.28 : hovered ? 0.22 : 0.16;
  const outer = featured ? 0.14 : hovered ? 0.11 : 0.08;

  return [
    `drop-shadow(0 0 ${Math.max(2, size * 0.1)}px rgba(${rgb}, ${base}))`,
    `drop-shadow(0 0 ${Math.max(4, size * 0.2)}px rgba(${rgb}, ${outer}))`,
  ].join(" ");
}

export const COMPACT_BADGE_ICON_SIZE = 22;
