/** Fixed public view count for @bam (uid 1) — does not change with new profile views. */
export const BAM_FROZEN_VIEW_COUNT = 8_675_309;

export function isFrozenViewCountProfile(
  profile: { username?: string | null; uid?: number | null } | null | undefined,
): boolean {
  return profile?.username?.toLowerCase() === "bam" && profile?.uid === 1;
}
