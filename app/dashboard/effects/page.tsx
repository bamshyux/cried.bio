import { redirect } from "next/navigation";
import { EffectsPageShell } from "@/components/dashboard/effects-editor";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { getProfileByUserId } from "@/lib/data/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function EffectsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [settings, profile] = await Promise.all([
    getSettingsByProfileId(userId),
    getProfileByUserId(userId),
  ]);

  if (!profile) redirect("/dashboard/profile");

  return <EffectsPageShell settings={settings} profile={profile} />;
}
