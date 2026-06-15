import {
  getBadgeIdsBySlugs,
  getBadgesByProfileId,
  profileHasBadge,
} from "@/lib/data/badges";
import { createNotification } from "@/lib/data/notifications";
import { createClient } from "@/lib/supabase/server";

export const YEAR_ONE_BADGE_SLUG = "year-one";
export const OG_BADGE_SLUG = "og";
export const OG_MAX_UID = 50;

/** Default end of BioForge's first year (Jun 14, 2027). Override with BIOFORGE_YEAR_ONE_END. */
export const DEFAULT_YEAR_ONE_END = "2027-06-14T23:59:59.999Z";

export function getYearOneCutoff(): Date {
  const raw = process.env.BIOFORGE_YEAR_ONE_END?.trim();
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(DEFAULT_YEAR_ONE_END);
}

export function isYearOneActive(now = new Date()): boolean {
  return now < getYearOneCutoff();
}

export function getSignupBadgeSlugs(uid: number | null | undefined, now = new Date()): string[] {
  const slugs: string[] = [];
  if (isYearOneActive(now)) slugs.push(YEAR_ONE_BADGE_SLUG);
  if (uid != null && uid <= OG_MAX_UID) slugs.push(OG_BADGE_SLUG);
  return slugs;
}

/** Auto-award Year One and OG signup badges. Idempotent. */
export async function syncSignupBadges(profileId: string): Promise<void> {
  const before = await getBadgesByProfileId(profileId);
  const beforeIds = new Set(before.map((badge) => badge.profile_badge_id));

  const supabase = await createClient();
  const { error } = await supabase.rpc("sync_signup_badges", {
    p_profile_id: profileId,
  });

  if (error) {
    if (/sync_signup_badges/i.test(error.message)) {
      await syncSignupBadgesFallback(profileId);
    } else {
      console.error("[badges] sync_signup_badges failed:", error.message);
      return;
    }
  }

  await notifyNewSignupBadges(profileId, beforeIds);
}

async function syncSignupBadgesFallback(profileId: string): Promise<void> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("uid")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) return;

  const slugs = getSignupBadgeSlugs(profile.uid);
  if (slugs.length === 0) return;

  const badgeIds = await getBadgeIdsBySlugs(slugs);

  for (const slug of slugs) {
    const badgeId = badgeIds.get(slug);
    if (!badgeId || (await profileHasBadge(profileId, badgeId))) continue;

    const { error } = await supabase.from("profile_badges").insert({
      profile_id: profileId,
      badge_id: badgeId,
      award_source: "event",
    });

    if (error && error.code !== "23505") {
      console.error(`[badges] syncSignupBadges ${slug} failed:`, error.message);
    }
  }
}

async function notifyNewSignupBadges(profileId: string, beforeIds: Set<string>) {
  const after = await getBadgesByProfileId(profileId);

  for (const badge of after) {
    if (beforeIds.has(badge.profile_badge_id)) continue;
    if (badge.slug !== YEAR_ONE_BADGE_SLUG && badge.slug !== OG_BADGE_SLUG) continue;

    await createNotification({
      userId: profileId,
      type: "milestone",
      title: `You earned the ${badge.name} badge`,
      body: badge.description,
      data: { badge_name: badge.name, badge_slug: badge.slug },
    });
  }
}
