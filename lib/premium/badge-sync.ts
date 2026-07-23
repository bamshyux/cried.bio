import { createAdminClient } from "@/lib/supabase/admin";

export async function syncPremiumBadge(profileId: string, grant: boolean): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const { data: badge } = await supabase
    .from("badges")
    .select("id")
    .eq("slug", "premium")
    .maybeSingle();

  if (!badge?.id) return;

  if (grant) {
    const { data: existing } = await supabase
      .from("profile_badges")
      .select("id")
      .eq("profile_id", profileId)
      .eq("badge_id", badge.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("profile_badges").insert({
        profile_id: profileId,
        badge_id: badge.id,
        award_source: "premium",
      });
    }
    return;
  }

  await supabase
    .from("profile_badges")
    .delete()
    .eq("profile_id", profileId)
    .eq("badge_id", badge.id)
    .eq("award_source", "premium");
}
