import { resolveProfileStatusColor } from "@/lib/settings";
import type { ProfileSettings } from "@/lib/types/settings";

/** @deprecated Presets removed — status is custom text + dot only */
export const STATUS_PRESET_OPTIONS = [] as const;

export function getStatusDisplay(settings: ProfileSettings) {
  const text = settings.profile_status?.trim() ?? "";
  return { text, color: resolveProfileStatusColor(settings) };
}
