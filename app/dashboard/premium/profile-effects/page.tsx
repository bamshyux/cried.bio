import { redirect } from "next/navigation";
import { ProfileAvatarEffectsPageShell } from "@/components/dashboard/profile-avatar-effects-editor";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { getProfileByUserId } from "@/lib/data/profiles";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileAvatarEffectsPage() {
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
    <ProfileAvatarEffectsPageShell
      settings={settings}
      profile={profile}
      entitlements={entitlements}
    />
  );
}
