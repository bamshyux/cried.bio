import { cardBorderEffectStripsDefaultBorder } from "@/lib/card-border-effects/resolve";
import { buildCardStyles } from "@/lib/settings";
import type { GuestbookBorderStyle, GuestbookSpacing, ProfileSettings } from "@/lib/types/settings";

function clampPct(value: number, fallback: number): number {
  const n = Number.isFinite(value) ? value : fallback;
  return Math.min(100, Math.max(0, n)) / 100;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  return null;
}

function buildGuestbookCardStyles(settings: ProfileSettings): {
  shell: Record<string, string | number>;
  backdrop: Record<string, string | number> | null;
} {
  const borderRadius = settings.border_radius;
  const borderHandledExternally = cardBorderEffectStripsDefaultBorder(settings, "guestbook");

  const shell: Record<string, string | number> = {
    borderRadius,
    border: borderHandledExternally ? "none" : "none",
    boxShadow: "none",
  };

  if (!settings.guestbook_show_background) {
    return { shell, backdrop: null };
  }

  const opacity = clampPct(settings.guestbook_opacity, 88);
  const blur = Math.max(0, settings.guestbook_blur ?? 0);
  const rgb = settings.guestbook_background_color?.trim()
    ? hexToRgb(settings.guestbook_background_color)
    : null;
  const rgba = (alpha: number) =>
    rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : `rgba(20, 20, 20, ${alpha})`;

  const shouldBlur = blur > 0;
  const useFrostedBackground = settings.guestbook_glassmorphism || shouldBlur;

  if (useFrostedBackground) {
    const backgroundAlpha = settings.guestbook_glassmorphism ? opacity * 0.85 : opacity;
    const finalAlpha = shouldBlur ? Math.min(backgroundAlpha, 0.72) : backgroundAlpha;

    return {
      shell,
      backdrop: {
        backgroundColor: rgba(finalAlpha),
        ...(shouldBlur
          ? {
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
            }
          : {}),
      },
    };
  }

  return {
    shell,
    backdrop: {
      backgroundColor: rgba(opacity),
    },
  };
}

export type ResolvedGuestbookAppearance = {
  borderStyle: GuestbookBorderStyle;
  spacing: GuestbookSpacing;
  shell: Record<string, string | number>;
  backdrop: Record<string, string | number> | null;
  content: Record<string, string | number>;
};

export function resolveGuestbookAppearance(settings: ProfileSettings): ResolvedGuestbookAppearance {
  const borderStyle = settings.guestbook_border_style ?? "accent-left";
  const spacing = settings.guestbook_spacing ?? "default";

  const cssVars: Record<string, string> = {
    "--bf-guestbook-label-opacity": String(clampPct(settings.guestbook_label_opacity, 18)),
    "--bf-guestbook-message-opacity": String(clampPct(settings.guestbook_message_opacity, 50)),
    "--bf-guestbook-author-opacity": String(clampPct(settings.guestbook_author_opacity, 38)),
    "--bf-guestbook-pinned-opacity": String(
      Math.min(1, clampPct(settings.guestbook_message_opacity, 50) + 0.12),
    ),
  };

  if (settings.guestbook_text_color?.trim()) {
    cssVars["--bf-guestbook-text-color"] = settings.guestbook_text_color.trim();
  }

  const paddingY = settings.guestbook_padding_y ?? 20;

  let shell: Record<string, string | number>;
  let backdrop: Record<string, string | number> | null;

  if (settings.guestbook_use_profile_card) {
    if (!settings.guestbook_show_background) {
      const { shell: profileShell } = buildCardStyles(settings);
      shell = {
        borderRadius: profileShell.borderRadius ?? settings.border_radius,
        border: "none",
        boxShadow: "none",
      };
      backdrop = null;
    } else {
      const styles = buildCardStyles(settings);
      shell = { ...styles.shell } as Record<string, string | number>;
      backdrop = { ...styles.backdrop } as Record<string, string | number>;
    }
  } else {
    const styles = buildGuestbookCardStyles(settings);
    shell = styles.shell;

    if (borderStyle === "none") {
      shell.border = "none";
      shell.boxShadow = "none";
    }

    backdrop = styles.backdrop;
  }

  return {
    borderStyle,
    spacing,
    shell,
    backdrop,
    content: {
      ...cssVars,
      paddingTop: `${paddingY}px`,
      paddingBottom: `${paddingY}px`,
    },
  };
}
