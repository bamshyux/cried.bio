import { createAdminClient } from "@/lib/supabase/admin";
import { getUserEntitlements } from "@/lib/premium/entitlements";

async function adminDb() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable.");
  return supabase;
}

export async function recipientHasVerifiedBadge(profileId: string): Promise<boolean> {
  const supabase = await adminDb();
  const { data: badge } = await supabase.from("badges").select("id").eq("slug", "verified").maybeSingle();
  if (!badge?.id) return false;

  const { data: owned } = await supabase
    .from("profile_badges")
    .select("id")
    .eq("profile_id", profileId)
    .eq("badge_id", badge.id)
    .maybeSingle();

  return Boolean(owned?.id);
}

export async function recipientHasStoreProduct(profileId: string, productSlug: string): Promise<boolean> {
  const supabase = await adminDb();

  const { data: selfPurchase } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", profileId)
    .eq("product_slug", productSlug)
    .eq("status", "completed")
    .limit(1)
    .maybeSingle();

  if (selfPurchase?.id) return true;

  const { data: giftPurchase } = await supabase
    .from("store_purchases")
    .select("id")
    .eq("recipient_profile_id", profileId)
    .eq("product_slug", productSlug)
    .not("fulfilled_at", "is", null)
    .limit(1)
    .maybeSingle();

  return Boolean(giftPurchase?.id);
}

export async function recipientPremiumState(profileId: string): Promise<{
  isActive: boolean;
  lifetime: boolean;
  billingType: "monthly" | "lifetime" | null;
}> {
  const entitlements = await getUserEntitlements(profileId);
  return {
    isActive: entitlements.is_active && entitlements.plan_tier !== "free",
    lifetime: entitlements.lifetime,
    billingType: entitlements.lifetime ? "lifetime" : entitlements.billing_type,
  };
}
