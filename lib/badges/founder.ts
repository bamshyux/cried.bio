import { getBadgeIdBySlug, profileHasBadge } from "@/lib/data/badges";
import { createClient } from "@/lib/supabase/server";

export const FOUNDER_BADGE_SLUG = "founder";
export const FOUNDER_BADGE_DESCRIPTION = "Founder of cried.bio";

/** Default founder username when CRIED_FOUNDER_USER_ID is not set. */
export const DEFAULT_FOUNDER_USERNAME = "bamshy";

export async function getFounderUserId(): Promise<string | null> {
  const fromEnv = process.env.CRIED_FOUNDER_USER_ID?.trim();
  if (fromEnv) return fromEnv;

  const username = process.env.CRIED_FOUNDER_USERNAME?.trim() || DEFAULT_FOUNDER_USERNAME;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  return data?.id ?? null;
}

export function isFounderProfile(profileId: string, founderId: string | null): boolean {
  return !!founderId && profileId === founderId;
}

export function isFounderBadgeSlug(slug: string): boolean {
  return slug === FOUNDER_BADGE_SLUG;
}

/** Keep the Founder badge exclusive to the configured founder account. */
export async function enforceFounderBadgeExclusive(): Promise<void> {
  const founderId = await getFounderUserId();
  const badgeId = await getBadgeIdBySlug(FOUNDER_BADGE_SLUG);
  if (!founderId || !badgeId) return;

  const supabase = await createClient();
  await supabase.from("profile_badges").delete().eq("badge_id", badgeId).neq("profile_id", founderId);
}

/** Auto-award the Founder badge to the founder if missing. */
export async function ensureFounderBadge(profileId: string): Promise<void> {
  const founderId = await getFounderUserId();
  if (!isFounderProfile(profileId, founderId)) return;

  const badgeId = await getBadgeIdBySlug(FOUNDER_BADGE_SLUG);
  if (!badgeId) return;

  if (await profileHasBadge(profileId, badgeId)) return;

  const supabase = await createClient();
  await supabase.from("profile_badges").insert({
    profile_id: profileId,
    badge_id: badgeId,
    award_source: "staff",
  });
}

export async function syncFounderBadge(profileId: string): Promise<void> {
  await enforceFounderBadgeExclusive();
  await ensureFounderBadge(profileId);
}
