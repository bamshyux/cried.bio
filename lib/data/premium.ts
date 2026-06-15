import { createClient } from "@/lib/supabase/server";
import type { PremiumEntitlements } from "@/lib/types/premium";
import { DEFAULT_PREMIUM_ENTITLEMENTS, PREMIUM_ENTITLEMENTS } from "@/lib/types/premium";

export async function getPremiumEntitlements(profileId: string): Promise<PremiumEntitlements> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("premium_tier, premium_expires_at")
    .eq("id", profileId)
    .maybeSingle();

  const isPremium =
    profile?.premium_tier === "premium" &&
    (!profile.premium_expires_at || new Date(profile.premium_expires_at) > new Date());

  const defaults = isPremium ? PREMIUM_ENTITLEMENTS : DEFAULT_PREMIUM_ENTITLEMENTS;

  const { data } = await supabase
    .from("premium_entitlements")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!data) {
    return {
      profile_id: profileId,
      ...defaults,
      updated_at: new Date().toISOString(),
    };
  }

  return {
    ...data,
    ...defaults,
    profile_id: profileId,
  } as PremiumEntitlements;
}

export async function isPremiumUser(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("premium_tier, premium_expires_at")
    .eq("id", profileId)
    .maybeSingle();
  return (
    data?.premium_tier === "premium" &&
    (!data.premium_expires_at || new Date(data.premium_expires_at) > new Date())
  );
}
