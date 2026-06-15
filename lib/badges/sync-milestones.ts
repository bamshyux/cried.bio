import { getBadgesByProfileId } from "@/lib/data/badges";
import { createNotification } from "@/lib/data/notifications";
import { createClient } from "@/lib/supabase/server";

/** Award view, follower, and account-age milestone badges. Idempotent. */
export async function syncAllMilestoneBadges(profileId: string): Promise<void> {
  const before = await getBadgesByProfileId(profileId);
  const beforeIds = new Set(before.map((badge) => badge.profile_badge_id));

  const supabase = await createClient();
  const { error } = await supabase.rpc("sync_all_milestone_badges", {
    p_profile_id: profileId,
  });

  if (error) {
    if (/sync_all_milestone_badges/i.test(error.message)) {
      await supabase.rpc("sync_view_milestone_badges", { p_profile_id: profileId });
      await notifyNewMilestoneBadges(profileId, beforeIds);
      return;
    }
    console.error("[badges] sync_all_milestone_badges failed:", error.message);
    return;
  }

  await notifyNewMilestoneBadges(profileId, beforeIds);
}

async function notifyNewMilestoneBadges(profileId: string, beforeIds: Set<string>) {
  const after = await getBadgesByProfileId(profileId);
  const newBadges = after.filter((badge) => !beforeIds.has(badge.profile_badge_id));

  for (const badge of newBadges) {
    await createNotification({
      userId: profileId,
      type: "milestone",
      title: `You earned the ${badge.name} badge`,
      body: badge.description,
      data: { badge_name: badge.name, badge_slug: badge.slug },
    });
  }
}
