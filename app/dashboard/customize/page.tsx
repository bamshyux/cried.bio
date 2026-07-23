import { redirect } from "next/navigation";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { createClient } from "@/lib/supabase/server";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { CustomizePageShell } from "@/components/dashboard/customize-editor";

export default async function CustomizePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [settings, entitlements] = await Promise.all([
    getSettingsByProfileId(userId),
    getUserEntitlements(userId),
  ]);

  return (
    <CustomizePageShell
      settings={settings}
      canUsePremiumFonts={entitlements.can_use_premium_fonts}
    />
  );
}
