import { redirect } from "next/navigation";
import { ProfilePresetsShell } from "@/components/dashboard/profile-presets/profile-presets-shell";
import { getProfilePresetsByUserId, resolveAppliedPresetId } from "@/lib/data/profile-presets";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePresetsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [presets, activePresetId] = await Promise.all([
    getProfilePresetsByUserId(userId),
    resolveAppliedPresetId(userId),
  ]);

  return <ProfilePresetsShell presets={presets} activePresetId={activePresetId} />;
}
