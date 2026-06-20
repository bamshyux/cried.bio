import type { ProfileSettings } from "@/lib/types/settings";
import type { OgBackground } from "@/lib/og/types";

/** Static OG background — never video, particles, or animated effects. */
export function resolveOgBackground(settings: ProfileSettings): OgBackground {
  if (
    settings.background_type === "image" &&
    settings.background_image_url?.trim()
  ) {
    return { kind: "image", url: settings.background_image_url.trim() };
  }

  const colors =
    settings.gradient_colors?.filter(Boolean).length >= 2
      ? settings.gradient_colors.filter(Boolean).slice(0, 4)
      : [settings.background_color || "#090909", "#141414", "#1a1a1a"];

  if (
    settings.background_type === "animated_gradient" ||
    settings.background_type === "particles" ||
    settings.background_type === "video"
  ) {
    return { kind: "gradient", colors };
  }

  if (settings.background_type === "solid") {
    return { kind: "solid", color: settings.background_color || "#090909" };
  }

  return { kind: "gradient", colors };
}

export function ogBackgroundCss(background: OgBackground): string {
  if (background.kind === "image") return "#090909";
  if (background.kind === "solid") return background.color;
  if (background.colors.length === 1) return background.colors[0];
  const stops = background.colors
    .map((color, index) => {
      const pct = Math.round((index / Math.max(background.colors.length - 1, 1)) * 100);
      return `${color} ${pct}%`;
    })
    .join(", ");
  return `linear-gradient(145deg, ${stops})`;
}
