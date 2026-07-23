import { createAdminClient } from "@/lib/supabase/admin";
import { syncPremiumBadge } from "@/lib/premium/badge-sync";
import { normalizePlanTier } from "@/lib/premium/plans";
import type { BillingType, SubscriptionStatus } from "@/lib/premium/types";

function requireAdmin() {
  const admin = createAdminClient();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for premium sync.");
  return admin;
}

export type GrantPremiumInput = {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
  stripePriceId: string;
  planName: string;
  billingType: BillingType;
  lifetime: boolean;
  status: SubscriptionStatus;
  currentPeriodEnd?: string | null;
};

export async function grantPremiumAccess(input: GrantPremiumInput): Promise<void> {
  const supabase = requireAdmin();
  const tier = normalizePlanTier(input.planName);
  const now = new Date().toISOString();

  await supabase
    .from("profiles")
    .update({
      premium_tier: tier === "free" ? "premium_lite" : tier,
      premium_expires_at: input.lifetime ? null : (input.currentPeriodEnd ?? null),
      stripe_customer_id: input.stripeCustomerId,
      updated_at: now,
    })
    .eq("id", input.userId);

  const row = {
    user_id: input.userId,
    stripe_customer_id: input.stripeCustomerId,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    stripe_price_id: input.stripePriceId,
    plan_name: input.planName,
    billing_type: input.billingType,
    status: input.status,
    lifetime: input.lifetime,
    current_period_end: input.currentPeriodEnd ?? null,
    updated_at: now,
  };

  const { data: existing } = await supabase
    .from("premium_subscriptions")
    .select("id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("premium_subscriptions").update(row).eq("user_id", input.userId);
  } else {
    await supabase.from("premium_subscriptions").insert(row);
  }

  await syncPremiumBadge(input.userId, true);
}

export async function revokePremiumAccess(
  userId: string,
  status: SubscriptionStatus = "expired",
): Promise<void> {
  const supabase = requireAdmin();
  const now = new Date().toISOString();

  const { data: lifetimeSub } = await supabase
    .from("premium_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("lifetime", true)
    .eq("status", "active")
    .maybeSingle();

  if (lifetimeSub) return;

  await supabase
    .from("profiles")
    .update({
      premium_tier: "free",
      premium_expires_at: null,
      updated_at: now,
    })
    .eq("id", userId);

  await supabase
    .from("premium_subscriptions")
    .update({ status, updated_at: now })
    .eq("user_id", userId)
    .eq("lifetime", false);

  await syncPremiumBadge(userId, false);
}

export async function findUserIdByStripeCustomer(customerId: string): Promise<string | null> {
  const supabase = requireAdmin();

  const { data: sub } = await supabase
    .from("premium_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .limit(1)
    .maybeSingle();

  if (sub?.user_id) return sub.user_id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return profile?.id ?? null;
}
