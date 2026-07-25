import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PurchaseStats, PurchaseWithCustomer } from "@/lib/purchases/display";
import { getStoreCatalogEntry } from "@/lib/store/catalog";
import { formatPurchaseReferenceId } from "@/lib/purchases/reference";
import type { Purchase } from "@/lib/types/store";

export type { PurchaseStats, PurchaseWithCustomer } from "@/lib/purchases/display";
export {
  formatPurchaseAmount,
  formatPurchaseStatus,
  searchPurchases,
} from "@/lib/purchases/display";

function mapPurchaseRow(row: Record<string, unknown>): Purchase {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    reference_id: String(row.reference_id ?? ""),
    stripe_checkout_session_id: String(row.stripe_checkout_session_id ?? ""),
    stripe_payment_intent: (row.stripe_payment_intent as string | null) ?? null,
    stripe_customer_id: (row.stripe_customer_id as string | null) ?? null,
    stripe_product_id: (row.stripe_product_id as string | null) ?? null,
    price_id: String(row.price_id ?? ""),
    product_slug: String(row.product_slug ?? ""),
    product_name: String(row.product_name ?? ""),
    amount_paid: Number(row.amount_paid) || 0,
    currency: String(row.currency ?? "usd"),
    status: String(row.status ?? "completed"),
    fulfillment_key: String(row.fulfillment_key ?? ""),
    payment_method: (row.payment_method as string | null) ?? null,
    receipt_number: (row.receipt_number as string | null) ?? null,
    invoice_number: (row.invoice_number as string | null) ?? null,
    created_at: String(row.created_at),
  };
}

function mapLegacyStorePurchase(row: Record<string, unknown>): Purchase {
  const slug = String(row.product_slug ?? "");
  const catalog = getStoreCatalogEntry(slug);
  const legacyId = String(row.id);

  return {
    id: legacyId,
    user_id: String(row.buyer_profile_id),
    reference_id: `CRIED-${legacyId.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
    stripe_checkout_session_id: String(row.stripe_session_id ?? ""),
    stripe_payment_intent: null,
    stripe_customer_id: null,
    stripe_product_id: catalog?.stripeProductId ?? null,
    price_id: catalog?.stripePriceId ?? "",
    product_slug: slug,
    product_name: catalog?.name ?? slug,
    amount_paid: Number(row.amount_cents) || 0,
    currency: "usd",
    status: row.fulfilled_at ? "completed" : "completed",
    fulfillment_key: catalog?.fulfillmentKey ?? "",
    payment_method: null,
    receipt_number: null,
    invoice_number: null,
    created_at: String(row.created_at),
  };
}

async function db() {
  return createAdminClient() ?? (await createClient());
}

export async function getPurchaseByReferenceId(
  referenceId: string,
  userId?: string,
): Promise<Purchase | null> {
  const normalized = formatPurchaseReferenceId(referenceId);
  const supabase = await db();
  let query = supabase.from("purchases").select("*").eq("reference_id", normalized);
  if (userId) query = query.eq("user_id", userId);

  const { data } = await query.maybeSingle();
  if (data) return mapPurchaseRow(data as Record<string, unknown>);

  if (!userId) return null;

  const legacyClient = await db();
  const { data: legacyRows } = await legacyClient
    .from("store_purchases")
    .select("*")
    .or(`buyer_profile_id.eq.${userId},recipient_profile_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  for (const row of legacyRows ?? []) {
    const mapped = mapLegacyStorePurchase(row as Record<string, unknown>);
    if (mapped.reference_id === normalized) return mapped;
  }

  return null;
}

export async function getPurchaseBySessionId(
  sessionId: string,
  userId?: string,
): Promise<Purchase | null> {
  const supabase = await db();
  let query = supabase
    .from("purchases")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId);
  if (userId) query = query.eq("user_id", userId);

  const { data } = await query.maybeSingle();
  return data ? mapPurchaseRow(data as Record<string, unknown>) : null;
}

export async function listPurchasesForUser(userId: string): Promise<Purchase[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  let purchases = (data ?? []).map((row) => mapPurchaseRow(row as Record<string, unknown>));

  if (purchases.length === 0) {
    const admin = createAdminClient();
    if (admin) {
      const { data: adminData } = await admin
        .from("purchases")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      purchases = (adminData ?? []).map((row) => mapPurchaseRow(row as Record<string, unknown>));
    }
  }

  if (purchases.length > 0) return purchases;

  const legacyClient = await db();
  const { data: legacy } = await legacyClient
    .from("store_purchases")
    .select("*")
    .or(`buyer_profile_id.eq.${userId},recipient_profile_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  return (legacy ?? []).map((row) => mapLegacyStorePurchase(row as Record<string, unknown>));
}

export async function listAllPurchasesAdmin(limit = 200): Promise<PurchaseWithCustomer[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("purchases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  const purchases = (data ?? []).map((row) => mapPurchaseRow(row as Record<string, unknown>));
  if (purchases.length === 0) return [];

  const purchaseIds = purchases.map((purchase) => purchase.id);
  const { data: giftRows } = await supabase
    .from("gifts")
    .select("purchase_id, sender_user_id, recipient_user_id, gift_message, reference_id")
    .in("purchase_id", purchaseIds);

  const giftByPurchase = new Map(
    (giftRows ?? []).map((row) => [String(row.purchase_id), row as Record<string, unknown>]),
  );

  const profileIds = [
    ...new Set(purchases.map((purchase) => purchase.user_id)),
    ...new Set(
      (giftRows ?? []).flatMap((row) => [String(row.sender_user_id), String(row.recipient_user_id)]),
    ),
  ];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", profileIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [String(profile.id), profile as Record<string, unknown>]),
  );

  const enriched: PurchaseWithCustomer[] = [];
  for (const purchase of purchases) {
    const profile = profileMap.get(purchase.user_id);
    const gift = giftByPurchase.get(purchase.id);
    let email: string | null = null;
    if (createAdminClient()) {
      const { getUserEmailById } = await import("@/lib/supabase/admin");
      email = await getUserEmailById(purchase.user_id);
    }

    const senderProfile = gift ? profileMap.get(String(gift.sender_user_id)) : null;
    const recipientProfile = gift ? profileMap.get(String(gift.recipient_user_id)) : null;

    enriched.push({
      ...purchase,
      username: profile ? String(profile.username ?? "") || null : null,
      display_name: profile ? String(profile.display_name ?? "") || null : null,
      email,
      is_gift: Boolean(gift),
      sender_username: senderProfile ? String(senderProfile.username ?? "") || null : null,
      recipient_username: recipientProfile ? String(recipientProfile.username ?? "") || null : null,
      gift_message: gift ? String(gift.gift_message ?? "") || null : null,
    });
  }

  return enriched;
}

export async function getPurchaseStats(): Promise<PurchaseStats> {
  const supabase = await db();
  const { data } = await supabase.from("purchases").select("amount_paid, status, fulfillment_key, created_at");

  const rows = data ?? [];
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  let totalRevenue = 0;
  let revenueToday = 0;
  let revenueThisMonth = 0;
  let revenueThisYear = 0;
  let refundCount = 0;
  let supportDonations = 0;
  let completedCount = 0;

  for (const row of rows) {
    const amount = Number(row.amount_paid) || 0;
    const status = String(row.status);
    const createdAt = new Date(String(row.created_at));

    if (status === "refunded") {
      refundCount += 1;
      continue;
    }

    if (status !== "completed") continue;

    completedCount += 1;
    totalRevenue += amount;

    if (createdAt >= startOfDay) revenueToday += amount;
    if (createdAt >= startOfMonth) revenueThisMonth += amount;
    if (createdAt >= startOfYear) revenueThisYear += amount;

    if (String(row.fulfillment_key) === "support_donation") {
      supportDonations += amount;
    }
  }

  return {
    totalRevenue,
    revenueToday,
    revenueThisMonth,
    revenueThisYear,
    totalPurchases: completedCount,
    refundCount,
    supportDonations,
    averageOrderValue: completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0,
  };
}
