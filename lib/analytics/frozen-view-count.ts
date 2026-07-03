/** Fixed public view count for @bam (uid 1) — does not change with new profile views. */
export const BAM_FROZEN_VIEW_COUNT = 8_675_309;

export function isFrozenViewCountProfile(
  profile:
    | { username?: string | null; uid?: number | null; view_count_frozen?: boolean | null }
    | null
    | undefined,
): boolean {
  if (profile?.view_count_frozen) return true;
  return profile?.username?.toLowerCase() === "bam" && profile?.uid === 1;
}
