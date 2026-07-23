import { syncPremiumBadge } from "@/lib/premium/badge-sync";
import { getUserEntitlements } from "@/lib/premium/entitlements";
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

async function upsertEntitlements(
  profileId: string,
  patch: Partial<{
    extra_profile_pages: number;
    custom_badge_slots: number;
    can_create_custom_badge: boolean;
    theme_pack_unlocked: boolean;
    supporter_pack_active: boolean;
    profile_boost_expires_at: string | null;
  }>,
) {
  const supabase = await adminDb();
  const { data: existing } = await supabase
    .from("profile_store_entitlements")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("profile_store_entitlements").insert({
      profile_id: profileId,
      ...patch,
    });
    return;
  }

  const merged = {
    extra_profile_pages:
      patch.extra_profile_pages !== undefined
        ? Number(existing.extra_profile_pages) + patch.extra_profile_pages
        : existing.extra_profile_pages,
    custom_badge_slots:
      patch.custom_badge_slots !== undefined
        ? Number(existing.custom_badge_slots) + patch.custom_badge_slots
        : existing.custom_badge_slots,
    can_create_custom_badge: patch.can_create_custom_badge ?? existing.can_create_custom_badge,
    theme_pack_unlocked: patch.theme_pack_unlocked ?? existing.theme_pack_unlocked,
    supporter_pack_active: patch.supporter_pack_active ?? existing.supporter_pack_active,
    profile_boost_expires_at: patch.profile_boost_expires_at ?? existing.profile_boost_expires_at,
    updated_at: new Date().toISOString(),
  };

  await supabase.from("profile_store_entitlements").update(merged).eq("profile_id", profileId);
}

export async function syncGifterBadge(profileId: string): Promise<void> {
  await grantBadge(profileId, "gifter", "store_gift");
}

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
  const supabase = await adminDb();

  const { data: purchase } = await supabase
    .from("store_purchases")
    .insert({
      buyer_profile_id: input.buyerProfileId,
      recipient_profile_id: input.recipientProfileId,
      product_id: input.product.id,
      product_slug: input.product.slug,
      stripe_session_id: input.stripeSessionId,
      amount_cents: input.amountCents,
      is_gift: input.isGift,
      gift_message: input.giftMessage?.trim() || null,
    })
    .select("id")
    .single();

  const recipientId = input.recipientProfileId;
  const key = input.product.fulfillment_key;

  switch (key) {
    case "custom_badge":
      await upsertEntitlements(recipientId, { can_create_custom_badge: true, custom_badge_slots: 1 });
      break;
    case "verified_badge":
      await grantBadge(recipientId, "verified", "store");
      {
        const entitlements = await getUserEntitlements(recipientId);
        if (!entitlements.is_active || entitlements.plan_tier === "free") {
          await syncPremiumBadge(recipientId, true);
        }
      }
      break;
    case "username_reservation": {
      const username = input.reservedUsername?.trim().toLowerCase();
      if (username) {
        await supabase.from("reserved_usernames").upsert({
          username,
          reason: "purchased reservation",
          created_by: recipientId,
        });
      }
      break;
    }
    case "profile_boost":
      await upsertEntitlements(recipientId, {
        profile_boost_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      break;
    case "extra_profile_page":
      await upsertEntitlements(recipientId, { extra_profile_pages: 1 });
      break;
    case "custom_badge_slot":
      await upsertEntitlements(recipientId, { custom_badge_slots: 1 });
      break;
    case "theme_pack":
      await upsertEntitlements(recipientId, { theme_pack_unlocked: true });
      break;
    case "supporter_pack":
      await upsertEntitlements(recipientId, { supporter_pack_active: true });
      await grantBadge(recipientId, "supporter", "store");
      break;
    default:
      break;
  }

  if (input.product.badge_slug && key !== "verified_badge" && key !== "supporter_pack") {
    await grantBadge(recipientId, input.product.badge_slug, "store");
  }

  if (input.isGift && input.buyerProfileId !== input.recipientProfileId) {
    await syncGifterBadge(input.buyerProfileId);
  }

  if (purchase?.id) {
    await supabase
      .from("store_purchases")
      .update({ fulfilled_at: new Date().toISOString() })
      .eq("id", purchase.id);
  }
}
