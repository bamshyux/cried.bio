import { redirect } from "next/navigation";
import { syncMilestoneBadges } from "@/app/actions/badges";
import { BadgesPageShell } from "@/components/dashboard/badges-editor";
import { getBadgeInventory, getBadgesByProfileId, getAllBadgesCatalog } from "@/lib/data/badges";
import { getProfileByUserId } from "@/lib/data/profiles";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";

export default async function BadgesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;

  await syncMilestoneBadges(userId);

  const [inventory, earnedBadges, settings, profile, catalog] = await Promise.all([
    getBadgeInventory(userId),
    getBadgesByProfileId(userId),
    getSettingsByProfileId(userId),
    getProfileByUserId(userId),
    getAllBadgesCatalog(),
  ]);

  return (
    <BadgesPageShell
      inventory={inventory}
      earnedBadges={earnedBadges}
      settings={settings}
      profile={profile}
      isAdmin={!!profile?.is_admin}
      catalog={catalog}
    />
  );
}
