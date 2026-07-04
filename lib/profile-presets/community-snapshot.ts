import { parsePresetData } from "@/lib/profile-presets/snapshot";
import type { ProfilePresetData } from "@/lib/types/profile-preset";

export function resolveCommunityPresetSnapshot(
  publishedPresetData: unknown,
  fallbackPresetData?: unknown,
  options?: { allowLiveFallback?: boolean },
): ProfilePresetData | null {
  const published = parsePresetData(publishedPresetData);
  if (published) return published;

  if (options?.allowLiveFallback && fallbackPresetData !== undefined) {
    return parsePresetData(fallbackPresetData);
  }

  return null;
}
