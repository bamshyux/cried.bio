import type { PageEntranceAnimation } from "@/lib/types/settings";

export const PAGE_ENTRANCE_ANIMATION_OPTIONS: {
  value: PageEntranceAnimation;
  label: string;
  description: string;
}[] = [
  { value: "none", label: "None", description: "Profile appears instantly with no motion." },
  { value: "pop-in", label: "Pop In", description: "Scale up from blur with a soft bounce." },
  { value: "unfold", label: "Unfold", description: "Card unfolds downward from the top edge." },
  { value: "slide-up", label: "Slide Up", description: "Rises smoothly from below the viewport." },
  { value: "zoom-burst", label: "Zoom Burst", description: "Explosive zoom from small to full size." },
  { value: "flip", label: "Flip", description: "3D flip into view from the top." },
  { value: "curtain", label: "Curtain", description: "Center curtain opens to reveal the profile." },
  { value: "drop", label: "Drop", description: "Falls in from above with a heavy bounce." },
  { value: "spiral", label: "Spiral", description: "Spins and scales into place." },
  { value: "glide", label: "Glide", description: "Slides in from the left with a fade." },
  { value: "elastic", label: "Elastic", description: "Big rubber-band overshoot settle." },
  { value: "spotlight", label: "Spotlight", description: "Circular spotlight expands to reveal the card." },
];

const PAGE_ENTRANCE_VALUES = new Set<string>(
  PAGE_ENTRANCE_ANIMATION_OPTIONS.map((option) => option.value),
);

export const PAGE_ENTRANCE_CLASS_NAMES = PAGE_ENTRANCE_ANIMATION_OPTIONS.filter(
  (option) => option.value !== "none",
).map((option) => `bf-page-entrance-${option.value}`);

export function parsePageEntranceAnimation(
  value: unknown,
  fallback: PageEntranceAnimation = "pop-in",
): PageEntranceAnimation {
  const key = String(value ?? "").trim();
  return PAGE_ENTRANCE_VALUES.has(key) ? (key as PageEntranceAnimation) : fallback;
}

export function resolvePageEntranceAnimation(
  row: { page_entrance_animation?: unknown; page_entrance?: unknown } | null | undefined,
  fallback: PageEntranceAnimation = "pop-in",
): PageEntranceAnimation {
  if (row?.page_entrance_animation != null && String(row.page_entrance_animation).trim()) {
    return parsePageEntranceAnimation(row.page_entrance_animation, fallback);
  }

  if (row?.page_entrance === false) return "none";
  if (row?.page_entrance === true) return "pop-in";
  return fallback;
}

export function getPageEntranceClassName(animation: PageEntranceAnimation): string | null {
  if (animation === "none") return null;
  return `bf-page-entrance-${animation}`;
}
