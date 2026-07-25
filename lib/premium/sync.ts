import { createAdminClient } from "@/lib/supabase/admin";
import { syncPremiumBadge } from "@/lib/premium/badge-sync";
import {
  cleanupPremiumContent,
  hasPremiumContent,
  revalidateAfterPremiumRevoke,
} from "@/lib/premium/revoke-content";
import { normalizePlanTier } from "@/lib/premium/plans";
import { resolvePremiumActiveState } from "@/lib/premium/subscription-status";
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
  /** When gifting monthly to an active monthly subscriber, extend instead of replace. */
  extendMonthlyIfActive?: boolean;
};

export async function grantPremiumAccess(input: GrantPremiumInput): Promise<void> {
  const supabase = requireAdmin();
  const tier = normalizePlanTier(input.planName);
  const now = new Date().toISOString();

  let currentPeriodEnd = input.currentPeriodEnd ?? null;

  if (input.extendMonthlyIfActive && !input.lifetime && input.billingType === "monthly") {
    const { data: existingSub } = await supabase
      .from("premium_subscriptions")
      .select("lifetime, current_period_end, billing_type, status")
      .eq("user_id", input.userId)
      .maybeSingle();

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("premium_expires_at, premium_tier")
      .eq("id", input.userId)
      .maybeSingle();

    const hasActiveMonthly =
      existingSub &&
      !existingSub.lifetime &&
      (existingSub.status === "active" || existingSub.status === "trialing");

    if (hasActiveMonthly) {
      const baseIso =
        existingSub.current_period_end ??
        profileRow?.premium_expires_at ??
        input.currentPeriodEnd ??
        now;
      const baseDate = new Date(baseIso);
      const extendFrom = baseDate.getTime() > Date.now() ? baseDate : new Date();
      extendFrom.setMonth(extendFrom.getMonth() + 1);
      currentPeriodEnd = extendFrom.toISOString();
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      premium_tier: tier === "free" ? "premium_lite" : tier,
      premium_expires_at: input.lifetime ? null : currentPeriodEnd,
      stripe_customer_id: input.stripeCustomerId,
      updated_at: now,
    })
    .eq("id", input.userId);

  if (profileError) {
    throw new Error(`Failed to update profile premium tier: ${profileError.message}`);
  }

  const row = {
    user_id: input.userId,
    stripe_customer_id: input.stripeCustomerId,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    stripe_price_id: input.stripePriceId,
    plan_name: input.planName,
    billing_type: input.billingType,
    status: input.status,
    lifetime: input.lifetime,
    current_period_end: currentPeriodEnd,
    updated_at: now,
  };

  const { data: existing, error: existingError } = await supabase
    .from("premium_subscriptions")
    .select("id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to read premium subscription: ${existingError.message}`);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("premium_subscriptions")
      .update(row)
      .eq("user_id", input.userId);
    if (updateError) {
      throw new Error(`Failed to update premium subscription: ${updateError.message}`);
    }
  } else {
    const { error: insertError } = await supabase.from("premium_subscriptions").insert(row);
    if (insertError) {
      throw new Error(`Failed to create premium subscription: ${insertError.message}`);
    }
  }

  await syncPremiumBadge(input.userId, true);
}

export async function revokePremiumAccess(
  userId: string,
  status: SubscriptionStatus = "expired",
  options?: { force?: boolean },
): Promise<void> {
  const supabase = requireAdmin();
  const now = new Date().toISOString();

  if (!options?.force) {
    const { data: lifetimeSub } = await supabase
      .from("premium_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("lifetime", true)
      .eq("status", "active")
      .maybeSingle();

    if (lifetimeSub) return;
  }

  await cleanupPremiumContent(userId);

  await supabase
    .from("profiles")
    .update({
      premium_tier: "free",
      premium_expires_at: null,
      updated_at: now,
    })
    .eq("id", userId);

  let subscriptionQuery = supabase
    .from("premium_subscriptions")
    .update({ status, updated_at: now })
    .eq("user_id", userId);

  if (!options?.force) {
    subscriptionQuery = subscriptionQuery.eq("lifetime", false);
  }

  await subscriptionQuery;

  await syncPremiumBadge(userId, false);
  await revalidateAfterPremiumRevoke(userId);
}

/** Downgrade lapsed premium and strip leftover premium content. */
export async function ensurePremiumDowngraded(userId: string): Promise<void> {
  const supabase = requireAdmin();

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase
      .from("profiles")
      .select("premium_tier, premium_expires_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("premium_subscriptions")
      .select("lifetime, status")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("lifetime", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { tier, active } = resolvePremiumActiveState({
    premium_tier: profile?.premium_tier,
    premium_expires_at: profile?.premium_expires_at,
    lifetime: Boolean(subscription?.lifetime),
  });

  if (!active && tier !== "free") {
    await revokePremiumAccess(userId, "expired");
    return;
  }

  if (!active && (await hasPremiumContent(userId))) {
    await cleanupPremiumContent(userId);
    await revalidateAfterPremiumRevoke(userId);
  }
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
