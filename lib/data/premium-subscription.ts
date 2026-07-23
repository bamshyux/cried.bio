import { createClient } from "@/lib/supabase/server";
import type { PremiumSubscription } from "@/lib/premium/types";

export async function getActiveSubscription(userId: string): Promise<PremiumSubscription | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("premium_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .order("lifetime", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as PremiumSubscription | null) ?? null;
}

export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.stripe_customer_id?.trim()) {
    return profile.stripe_customer_id.trim();
  }

  const { data: sub } = await supabase
    .from("premium_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .neq("stripe_customer_id", "")
    .limit(1)
    .maybeSingle();

  return sub?.stripe_customer_id?.trim() || null;
}
