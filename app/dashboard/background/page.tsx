import { redirect } from "next/navigation";
import { BackgroundPageShell } from "@/components/dashboard/background-editor";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { resolveMaxUploadBytes } from "@/lib/uploads/limits";
import { createClient } from "@/lib/supabase/server";

export default async function BackgroundPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [settings, entitlements] = await Promise.all([
    getSettingsByProfileId(userId),
    getUserEntitlements(userId),
  ]);
  return (
    <BackgroundPageShell
      settings={settings}
      maxUploadBytes={resolveMaxUploadBytes(entitlements)}
    />
  );
}
