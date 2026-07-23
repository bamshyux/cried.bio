import { redirect } from "next/navigation";
import { CustomEffectPage } from "@/components/premium/custom-effect-page";
import { getProfileByUserId } from "@/lib/data/profiles";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { createClient } from "@/lib/supabase/server";

export default async function CustomEffectRequestPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [entitlements, profile] = await Promise.all([
    getUserEntitlements(userId),
    getProfileByUserId(userId),
  ]);

  return (
    <CustomEffectPage
      allowed={entitlements.can_use_custom_effect_request}
      username={profile?.username ?? null}
    />
  );
}
