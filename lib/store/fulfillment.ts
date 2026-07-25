import { syncPremiumBadge } from "@/lib/premium/badge-sync";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import {
  getStoreCatalogEntry,
  getStoreCatalogEntryByPriceId,
  type StoreCatalogEntry,
} from "@/lib/store/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StoreProduct } from "@/lib/types/store";

async function adminDb() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable.");
  return supabase;
}

async function grantBadge(profileId: string, slug: string, source: string) {
  const supabase = await adminDb();
  const { data: badge } = await supabase.from("badges").select("id").eq("slug", slug).maybeSingle();
  if (!badge?.id) return;

  const { data: existing } = await supabase
    .from("profile_badges")
    .select("id")
    .eq("profile_id", profileId)
    .eq("badge_id", badge.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("profile_badges").insert({
      profile_id: profileId,
      badge_id: badge.id,
      award_source: source,
    });
  }
}

export async function purchaseAlreadyProcessed(stripeSessionId: string): Promise<boolean> {
  const supabase = await adminDb();
  const { data } = await supabase
    .from("purchases")
    .select("id")
    .eq("stripe_checkout_session_id", stripeSessionId)
    .maybeSingle();
  return Boolean(data?.id);
}

function resolveCatalogEntry(input: {
  product?: StoreProduct | null;
  productSlug?: string | null;
  priceId?: string | null;
}): StoreCatalogEntry | null {
  if (input.productSlug) {
    return getStoreCatalogEntry(input.productSlug);
  }
  if (input.priceId) {
    return getStoreCatalogEntryByPriceId(input.priceId);
  }
  if (input.product?.slug) {
    return getStoreCatalogEntry(input.product.slug);
  }
  return null;
}

async function recordPurchase(input: {
  userId: string;
  stripeSessionId: string;
  stripePaymentIntent: string | null;
  stripeProductId: string | null;
  priceId: string;
  productSlug: string;
  productName: string;
  amountPaid: number;
  currency: string;
  fulfillmentKey: string;
}) {
  const supabase = await adminDb();
  const { error } = await supabase.from("purchases").insert({
    user_id: input.userId,
    stripe_checkout_session_id: input.stripeSessionId,
    stripe_payment_intent: input.stripePaymentIntent,
    stripe_product_id: input.stripeProductId,
    price_id: input.priceId,
    product_slug: input.productSlug,
    product_name: input.productName,
    amount_paid: input.amountPaid,
    currency: input.currency,
    status: "completed",
    fulfillment_key: input.fulfillmentKey,
  });

  if (error && !error.message.includes("duplicate") && error.code !== "23505") {
    throw new Error(error.message);
  }
}

async function applyPurchaseRewards(
  recipientId: string,
  catalog: StoreCatalogEntry,
): Promise<void> {
  switch (catalog.fulfillmentAction) {
    case "grant_verified_badge":
      await grantBadge(recipientId, "verified", "store");
      {
        const entitlements = await getUserEntitlements(recipientId);
        if (!entitlements.is_active || entitlements.plan_tier === "free") {
          await syncPremiumBadge(recipientId, true);
        }
      }
      break;
    case "grant_donor_badge":
      await grantBadge(recipientId, "donor", "store");
      break;
    case "contact_support":
      break;
    default:
      break;
  }
}

export async function fulfillStoreCheckout(input: {
  buyerProfileId: string;
  recipientProfileId: string;
  product?: StoreProduct | null;
  productSlug?: string | null;
  priceId?: string | null;
  stripeSessionId: string;
  stripePaymentIntent?: string | null;
  amountPaid: number;
  currency: string;
  isGift?: boolean;
  giftMessage?: string | null;
  reservedUsername?: string | null;
}): Promise<{ alreadyProcessed: boolean }> {
  if (await purchaseAlreadyProcessed(input.stripeSessionId)) {
    return { alreadyProcessed: true };
  }

  const catalog = resolveCatalogEntry({
    product: input.product,
    productSlug: input.productSlug,
    priceId: input.priceId,
  });

  if (!catalog && !input.product) {
    throw new Error("Unknown store product.");
  }

  const recipientId = input.recipientProfileId;
  const productSlug = catalog?.slug ?? input.product!.slug;
  const productName = catalog?.name ?? input.product!.name;
  const fulfillmentKey = catalog?.fulfillmentKey ?? input.product!.fulfillment_key;
  const stripeProductId =
    catalog?.stripeProductId ?? input.product?.stripe_product_id ?? input.product?.stripe_product_id ?? null;
  const priceId = input.priceId ?? catalog?.stripePriceId ?? input.product?.stripe_price_id ?? "";

  await recordPurchase({
    userId: input.buyerProfileId,
    stripeSessionId: input.stripeSessionId,
    stripePaymentIntent: input.stripePaymentIntent ?? null,
    stripeProductId,
    priceId,
    productSlug,
    productName,
    amountPaid: input.amountPaid,
    currency: input.currency,
    fulfillmentKey,
  });

  if (catalog) {
    await applyPurchaseRewards(recipientId, catalog);
  } else if (input.product) {
    if (input.product.fulfillment_key === "verified_badge") {
      await grantBadge(recipientId, "verified", "store");
      const entitlements = await getUserEntitlements(recipientId);
      if (!entitlements.is_active || entitlements.plan_tier === "free") {
        await syncPremiumBadge(recipientId, true);
      }
    } else if (input.product.fulfillment_key === "support_donation") {
      await grantBadge(recipientId, "donor", "store");
    }
  }

  const supabase = await adminDb();
  await supabase.from("store_purchases").insert({
    buyer_profile_id: input.buyerProfileId,
    recipient_profile_id: recipientId,
    product_id: input.product?.id ?? null,
    product_slug: productSlug,
    stripe_session_id: input.stripeSessionId,
    amount_cents: input.amountPaid,
    is_gift: Boolean(input.isGift),
    gift_message: input.giftMessage?.trim() || null,
    fulfilled_at: new Date().toISOString(),
  });

  return { alreadyProcessed: false };
}

/** @deprecated Use fulfillStoreCheckout */
export async function fulfillStoreProduct(input: {
  buyerProfileId: string;
  recipientProfileId: string;
  product: StoreProduct;
  stripeSessionId: string;
  amountCents: number;
  isGift: boolean;
  giftMessage?: string | null;
  reservedUsername?: string | null;
}): Promise<void> {
  await fulfillStoreCheckout({
    buyerProfileId: input.buyerProfileId,
    recipientProfileId: input.recipientProfileId,
    product: input.product,
    productSlug: input.product.slug,
    priceId: input.product.stripe_price_id ?? undefined,
    stripeSessionId: input.stripeSessionId,
    amountPaid: input.amountCents,
    currency: "usd",
    isGift: input.isGift,
    giftMessage: input.giftMessage,
    reservedUsername: input.reservedUsername,
  });
}

export async function syncGifterBadge(profileId: string): Promise<void> {
  await grantBadge(profileId, "gifter", "store_gift");
}
