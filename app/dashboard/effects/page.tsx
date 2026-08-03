import { redirect } from "next/navigation";
import { EffectsPageShell } from "@/components/dashboard/effects-editor";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { getProfileByUserId } from "@/lib/data/profiles";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { resolveMaxUploadBytes } from "@/lib/uploads/limits";
import { createClient } from "@/lib/supabase/server";

export default async function EffectsPage() {
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

  return (
    <EffectsPageShell
      settings={settings}
      profile={profile}
      maxUploadBytes={resolveMaxUploadBytes(entitlements)}
    />
  );
}
