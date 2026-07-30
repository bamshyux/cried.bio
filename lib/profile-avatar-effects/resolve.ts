import type { CardBorderEffectPreset } from "@/lib/card-border-effects/types";
import type { ResolvedCardBorderEffect } from "@/lib/card-border-effects/types";
import type { ProfileSettings } from "@/lib/types/settings";
import { PROFILE_AVATAR_EFFECT_PRESETS } from "@/lib/profile-avatar-effects/presets";
import type { ProfileAvatarEffectPreset } from "@/lib/profile-avatar-effects/presets";

export function parseProfileAvatarEffect(value: string, fallback: ProfileAvatarEffectPreset): ProfileAvatarEffectPreset {
  if (PROFILE_AVATAR_EFFECT_PRESETS.has(value as ProfileAvatarEffectPreset)) {
    return value as ProfileAvatarEffectPreset;
  }
  return fallback;
}

function speedToDuration(speed: number): number {
  const clamped = Math.min(300, Math.max(25, speed));
  return Math.round((6000 / clamped) * 10) / 10;
}

export function resolveProfileAvatarEffect(
  settings: ProfileSettings,
  sizePx: number,
): ResolvedCardBorderEffect | null {
  const effect = (settings.profile_avatar_effect ?? "none") as CardBorderEffectPreset;
  if (effect === "none") return null;

  const radius = Math.max(0, sizePx / 2);
  const thickness = Math.min(8, Math.max(1, settings.profile_avatar_effect_thickness ?? 3));
  const glowPct = Math.min(100, Math.max(0, settings.profile_avatar_effect_glow ?? 70));
  const glow = glowPct / 100;

  return {
    effect,
    showGlow: effect !== "standard",
    style: {
      "--cbe-radius": `${radius}px`,
      "--cbe-thickness": `${thickness}px`,
      "--cbe-duration": `${speedToDuration(settings.profile_avatar_effect_speed ?? 100)}s`,
      "--cbe-glow": String(glow),
      "--cbe-glow-pct": String(glowPct),
      "--cbe-color": settings.profile_avatar_effect_color?.trim() || settings.accent_color,
      "--cbe-color-2":
        settings.profile_avatar_effect_secondary_color?.trim() ||
        settings.gradient_colors?.[1] ||
        settings.accent_color,
    },
  };
}

/** Parse tailwind h-* class to pixel size for avatar effect radius. */
export function avatarSizeFromClassName(className: string, fallback = 96): number {
  let max = 0;
  for (const match of className.matchAll(/\bh-(?:\[(\d+)px\]|(\d+(?:\.\d+)?))/g)) {
    const px = match[1]
      ? Number.parseInt(match[1], 10)
      : Math.round(Number.parseFloat(match[2] ?? "") * 4);
    if (Number.isFinite(px)) max = Math.max(max, px);
  }
  return max > 0 ? max : fallback;
}
