import { redirect } from "next/navigation";
import { PagesShell } from "@/components/dashboard/pages-shell";
import { getProfilePages } from "@/lib/data/profile-pages";
import { getProfileByUserId } from "@/lib/data/profiles";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { createClient } from "@/lib/supabase/server";

export default async function PagesDashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [pages, profile, entitlements, settings] = await Promise.all([
    getProfilePages(userId),
    getProfileByUserId(userId),
    getUserEntitlements(userId),
    getSettingsByProfileId(userId),
  ]);

  return (
    <PagesShell
      pages={pages}
      username={profile?.username ?? null}
      entitlements={entitlements}
      pageNavPosition={settings.page_nav_position}
    />
  );
}
