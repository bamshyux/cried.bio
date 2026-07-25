import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getCreditGrantForFulfillmentKey,
  getCreditTypeForRoute,
  type StoreBadgeCreationRoute,
  type StoreBadgeCredit,
  type StoreBadgeCreditType,
} from "@/lib/store/badge-credits-shared";

export type {
  StoreBadgeCreationRoute,
  StoreBadgeCredit,
  StoreBadgeCreditType,
} from "@/lib/store/badge-credits-shared";

export {
  getBadgeCreationPathForProductSlug,
  getCreditGrantForFulfillmentKey,
  getCreditTypeForRoute,
  getRouteForCreditType,
} from "@/lib/store/badge-credits-shared";

function mapCredit(row: Record<string, unknown>): StoreBadgeCredit {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    purchase_id: String(row.purchase_id),
    credit_type: row.credit_type as StoreBadgeCreditType,
    slots_total: Number(row.slots_total) || 0,
    slots_used: Number(row.slots_used) || 0,
    created_at: String(row.created_at),
    completed_at: (row.completed_at as string | null) ?? null,
  };
}

export async function grantBadgeCreditForPurchase(input: {
  userId: string;
  purchaseId: string;
  fulfillmentKey: string;
}): Promise<void> {
  const grant = getCreditGrantForFulfillmentKey(input.fulfillmentKey);
  if (!grant) return;

  const admin = createAdminClient();
  if (!admin) throw new Error("Admin client unavailable.");

  const { error } = await admin.from("store_badge_credits").upsert(
    {
      user_id: input.userId,
      purchase_id: input.purchaseId,
      credit_type: grant.creditType,
      slots_total: grant.slots,
      slots_used: 0,
      completed_at: null,
    },
    { onConflict: "purchase_id", ignoreDuplicates: true },
  );

  if (error) throw new Error(error.message);
}

export async function ensureBadgeCreditsForPurchaseSession(stripeSessionId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const { data: purchase } = await admin
    .from("purchases")
    .select("id, user_id, fulfillment_key")
    .eq("stripe_checkout_session_id", stripeSessionId)
    .maybeSingle();

  if (!purchase?.id) return;

  let recipientId = String(purchase.user_id);
  const { data: storePurchase } = await admin
    .from("store_purchases")
    .select("recipient_profile_id")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  if (storePurchase?.recipient_profile_id) {
    recipientId = String(storePurchase.recipient_profile_id);
  }

  await grantBadgeCreditForPurchase({
    userId: recipientId,
    purchaseId: String(purchase.id),
    fulfillmentKey: String(purchase.fulfillment_key),
  });
}

export async function getActiveBadgeCredit(
  userId: string,
  creditType: StoreBadgeCreditType,
): Promise<StoreBadgeCredit | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_badge_credits")
    .select("*")
    .eq("user_id", userId)
    .eq("credit_type", creditType)
    .order("created_at", { ascending: true });

  const active = (data ?? [])
    .map((row) => mapCredit(row as Record<string, unknown>))
    .find((credit) => credit.slots_used < credit.slots_total);

  return active ?? null;
}

export async function listPendingBadgeCredits(userId: string): Promise<StoreBadgeCredit[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_badge_credits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? [])
    .map((row) => mapCredit(row as Record<string, unknown>))
    .filter((credit) => credit.slots_used < credit.slots_total);
}

export async function consumeBadgeCredit(input: {
  creditId: string;
  userId: string;
  badgeId: string;
}): Promise<{ error?: string }> {
  const admin = createAdminClient();
  if (!admin) return { error: "Badge creation is temporarily unavailable." };

  const { data: credit, error: readError } = await admin
    .from("store_badge_credits")
    .select("*")
    .eq("id", input.creditId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (readError) return { error: readError.message };
  if (!credit) return { error: "No badge creation credit found." };

  const mapped = mapCredit(credit as Record<string, unknown>);
  if (mapped.slots_used >= mapped.slots_total) {
    return { error: "You have already used this badge purchase." };
  }

  const nextUsed = mapped.slots_used + 1;
  const completedAt = nextUsed >= mapped.slots_total ? new Date().toISOString() : null;

  const { error: updateError } = await admin
    .from("store_badge_credits")
    .update({
      slots_used: nextUsed,
      completed_at: completedAt,
    })
    .eq("id", input.creditId)
    .eq("user_id", input.userId)
    .eq("slots_used", mapped.slots_used);

  if (updateError) return { error: updateError.message };

  const { error: linkError } = await admin.from("store_badge_creations").insert({
    credit_id: input.creditId,
    badge_id: input.badgeId,
    user_id: input.userId,
  });

  if (linkError) return { error: linkError.message };

  return {};
}

export async function requireBadgeCreationAccess(
  userId: string,
  route: StoreBadgeCreationRoute,
): Promise<StoreBadgeCredit | null> {
  const creditType = getCreditTypeForRoute(route);
  return getActiveBadgeCredit(userId, creditType);
}
