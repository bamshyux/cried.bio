import { redirect } from "next/navigation";
import { CardBorderEffectsPageShell } from "@/components/dashboard/card-border-effects-editor";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { getProfileByUserId } from "@/lib/data/profiles";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { createClient } from "@/lib/supabase/server";

export default async function CardBorderEffectsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [settings, profile, entitlements] = await Promise.all([
    getSettingsByProfileId(userId),
    getProfileByUserId(userId),
    getUserEntitlements(userId),
  ]);

  if (!profile) redirect("/dashboard/profile");

  return <CardBorderEffectsPageShell settings={settings} entitlements={entitlements} />;
}
