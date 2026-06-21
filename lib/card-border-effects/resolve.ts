import type { ProfileSettings } from "@/lib/types/settings";
import {
  CARD_BORDER_TARGETS,
  type CardBorderEffectConfig,
  type CardBorderEffectPreset,
  type CardBorderTarget,
  type ResolvedCardBorderEffect,
} from "@/lib/card-border-effects/types";

export function parseCardBorderTargets(raw: unknown): CardBorderTarget[] {
  if (Array.isArray(raw)) {
    return raw.filter((value): value is CardBorderTarget =>
      CARD_BORDER_TARGETS.includes(value as CardBorderTarget),
    );
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parseCardBorderTargets(parsed);
    } catch {
      return raw
        .split(",")
        .map((part) => part.trim())
        .filter((part): part is CardBorderTarget =>
          CARD_BORDER_TARGETS.includes(part as CardBorderTarget),
        );
    }
  }
  return [...CARD_BORDER_TARGETS];
}

export function readCardBorderConfig(settings: ProfileSettings): CardBorderEffectConfig {
  return {
    effect: (settings.card_border_effect ?? "none") as CardBorderEffectPreset,
    thickness: settings.card_border_thickness ?? 2,
    speed: settings.card_border_speed ?? 100,
    glowIntensity: settings.card_border_glow_intensity ?? 60,
    color: settings.card_border_color?.trim() || settings.accent_color,
    secondaryColor:
      settings.card_border_secondary_color?.trim() ||
      settings.gradient_colors?.[1] ||
      settings.accent_color,
    applyAll: settings.card_border_apply_all ?? true,
    targets: parseCardBorderTargets(settings.card_border_targets),
  };
}

export function isCardBorderTargetEnabled(
  config: CardBorderEffectConfig,
  target: CardBorderTarget,
): boolean {
  if (config.effect === "none") return false;
  if (config.applyAll) return true;
  return config.targets.includes(target);
}

export function cardBorderEffectStripsDefaultBorder(
  settings: ProfileSettings,
  target: CardBorderTarget = "main",
): boolean {
  const config = readCardBorderConfig(settings);
  return isCardBorderTargetEnabled(config, target);
}

function speedToDuration(speed: number): number {
  const clamped = Math.min(300, Math.max(25, speed));
  return Math.round((6000 / clamped) * 10) / 10;
}

export function getCardBorderInnerRadius(
  settings: ProfileSettings,
  target: CardBorderTarget,
  outerRadius?: number,
): number {
  const config = readCardBorderConfig(settings);
  const outer = outerRadius ?? settings.border_radius;
  if (!isCardBorderTargetEnabled(config, target)) return outer;
  return Math.max(0, outer - Math.min(12, Math.max(1, config.thickness)));
}

export function resolveCardBorderEffect(
  settings: ProfileSettings,
  target: CardBorderTarget,
  borderRadius?: number,
): ResolvedCardBorderEffect | null {
  const config = readCardBorderConfig(settings);
  if (!isCardBorderTargetEnabled(config, target)) return null;

  const radius = borderRadius ?? settings.border_radius;
  const glow = Math.min(100, Math.max(0, config.glowIntensity)) / 100;
  const thickness = Math.min(12, Math.max(1, config.thickness));

  return {
    effect: config.effect,
    showGlow: config.effect !== "standard" && config.effect !== "none",
    style: {
      "--cbe-radius": `${radius}px`,
      "--cbe-thickness": `${thickness}px`,
      "--cbe-inner-radius": `${Math.max(0, radius - thickness)}px`,
      "--cbe-duration": `${speedToDuration(config.speed)}s`,
      "--cbe-glow": String(glow),
      "--cbe-color": config.color,
      "--cbe-color-2": config.secondaryColor,
    },
  };
}
