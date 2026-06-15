import { createClient } from "@/lib/supabase/server";

/** Award view, follower, and account-age milestone badges. Idempotent. */
export async function syncAllMilestoneBadges(profileId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("sync_all_milestone_badges", {
    p_profile_id: profileId,
  });

  if (error) {
    if (/sync_all_milestone_badges/i.test(error.message)) {
      await supabase.rpc("sync_view_milestone_badges", { p_profile_id: profileId });
      return;
    }
    console.error("[badges] sync_all_milestone_badges failed:", error.message);
  }
}
