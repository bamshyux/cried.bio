import type { ProfileLayout, ProfileSettings } from "@/lib/types/settings";

/** Layouts that show a customizable label line. Defaults used when layout_label is empty. */
export const LAYOUT_LABEL_DEFAULTS: Partial<Record<ProfileLayout, string>> = {
  ticket: "Admit One",
  vinyl: "Side A",
  idcard: "Official ID",
  cyberpunk: "netrunner",
  luxury: "Curated Profile",
  vaporwave: "Aesthetic",
  twitch: "Live",
  blueprint: "cried.bio",
  zine: "Issue",
  passport: "VISITOR",
  cassette: "Side A",
  command: "OPS-ACTIVE",
  festival: "ALL ACCESS",
};

export function layoutSupportsCustomLabel(layout: ProfileLayout): boolean {
  return layout in LAYOUT_LABEL_DEFAULTS;
}

export function resolveLayoutLabel(settings: ProfileSettings): string {
  const custom = settings.layout_label?.trim();
  if (custom) return custom;
  return LAYOUT_LABEL_DEFAULTS[settings.layout] ?? "";
}

export function getLayoutLabelPlaceholder(layout: ProfileLayout): string {
  return LAYOUT_LABEL_DEFAULTS[layout] ?? "Custom label";
}

export function getLayoutLabelHint(layout: ProfileLayout): string {
  switch (layout) {
    case "ticket":
      return "Shown at the top of your ticket stub";
    case "vinyl":
      return "Shown above your track listing";
    case "idcard":
      return "Shown as the ID card header";
    case "cyberpunk":
      return "Shown above your display name";
    case "zine":
      return 'Prefix before your issue number (e.g. "Issue #42")';
    case "blueprint":
      return "Shown in the blueprint header line";
    default:
      return "Custom text for your current layout";
  }
}
