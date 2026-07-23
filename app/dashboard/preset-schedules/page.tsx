import { redirect } from "next/navigation";
import { PresetSchedulesShell } from "@/components/dashboard/preset-schedules-shell";
import { getPresetSchedules } from "@/lib/data/preset-schedules";
import { getProfilePresetsByUserId } from "@/lib/data/profile-presets";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { createClient } from "@/lib/supabase/server";

export default async function PresetSchedulesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [schedules, presets, entitlements] = await Promise.all([
    getPresetSchedules(userId),
    getProfilePresetsByUserId(userId),
    getUserEntitlements(userId),
  ]);

  return (
    <PresetSchedulesShell
      schedules={schedules}
      presets={presets}
      entitlements={entitlements}
    />
  );
}
