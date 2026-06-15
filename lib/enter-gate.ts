import type {
  EnterGateAnimation,
  EnterGateBackgroundType,
  EnterGateButtonStyle,
  EnterGateTextAlign,
  ProfileSettings,
} from "@/lib/types/settings";

export const ENTER_GATE_BACKGROUND_OPTIONS: { value: EnterGateBackgroundType; label: string }[] = [
  { value: "solid", label: "Solid color" },
  { value: "gradient", label: "Gradient" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video (MP4)" },
  { value: "profile", label: "Profile background (blurred)" },
];

export const ENTER_GATE_BUTTON_STYLE_OPTIONS: { value: EnterGateButtonStyle; label: string }[] = [
  { value: "pill", label: "Pill (accent fill)" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
  { value: "minimal", label: "Minimal text" },
  { value: "glow", label: "Neon glow" },
];

export const ENTER_GATE_ANIMATION_OPTIONS: { value: EnterGateAnimation; label: string }[] = [
  { value: "none", label: "None" },
  { value: "pulse", label: "Pulse" },
  { value: "fade", label: "Fade" },
  { value: "bounce", label: "Bounce" },
  { value: "glow", label: "Glow pulse" },
];

export const ENTER_GATE_TEXT_ALIGN_OPTIONS: { value: EnterGateTextAlign; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export function resolveEnterGateAccent(settings: ProfileSettings) {
  return settings.enter_gate_accent_color.trim() || settings.accent_color;
}

export function resolveEnterGateTitleColor(settings: ProfileSettings) {
  return settings.enter_gate_title_color.trim() || "#ffffff";
}

export function resolveEnterGateSubtitleColor(settings: ProfileSettings) {
  return settings.enter_gate_subtitle_color.trim() || "#a3a3a3";
}

export function getEnterGateAlignClasses(align: EnterGateTextAlign) {
  switch (align) {
    case "left":
      return { container: "items-start", card: "items-start text-left" };
    case "right":
      return { container: "items-end", card: "items-end text-right" };
    default:
      return { container: "items-center", card: "items-center text-center" };
  }
}

export function getEnterGateButtonClasses(animation: EnterGateAnimation) {
  switch (animation) {
    case "none":
      return "";
    case "fade":
      return "bf-enter-gate-btn--fade";
    case "bounce":
      return "bf-enter-gate-btn--bounce";
    case "glow":
      return "bf-enter-gate-btn--glow";
    default:
      return "bf-enter-gate-btn";
  }
}

export function getEnterGateButtonStyle(
  style: EnterGateButtonStyle,
  accent: string,
): Record<string, string | number | undefined> {
  switch (style) {
    case "outline":
      return {
        borderColor: `${accent}88`,
        backgroundColor: "transparent",
        boxShadow: "none",
      };
    case "ghost":
      return {
        borderColor: "transparent",
        backgroundColor: `${accent}12`,
        boxShadow: "none",
      };
    case "minimal":
      return {
        borderColor: "transparent",
        backgroundColor: "transparent",
        boxShadow: "none",
        paddingLeft: 0,
        paddingRight: 0,
      };
    case "glow":
      return {
        borderColor: `${accent}66`,
        backgroundColor: `${accent}22`,
        boxShadow: `0 0 40px ${accent}55, 0 0 80px ${accent}22`,
      };
    default:
      return {
        borderColor: `${accent}55`,
        backgroundColor: `${accent}18`,
        boxShadow: `0 0 32px ${accent}22`,
      };
  }
}

export function buildEnterGateGradientStyle(settings: ProfileSettings) {
  const colors =
    settings.enter_gate_gradient_colors.length >= 2
      ? settings.enter_gate_gradient_colors
      : ["#090909", "#141414"];

  return {
    background: `linear-gradient(135deg, ${colors.join(", ")})`,
    backgroundSize: settings.enter_gate_animated_gradient ? "400% 400%" : undefined,
    animation: settings.enter_gate_animated_gradient ? "bf-gradient-shift 10s ease infinite" : undefined,
  };
}
