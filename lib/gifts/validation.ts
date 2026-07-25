import { getProfileIdByUsername } from "@/lib/data/store";
import { getStoreCatalogEntry } from "@/lib/store/catalog";
import type { GiftProductTarget, GiftValidationResult } from "@/lib/types/gift";
import {
  recipientHasStoreProduct,
  recipientHasVerifiedBadge,
  recipientPremiumState,
} from "@/lib/gifts/ownership";

export function isStoreProductGiftable(slug: string): boolean {
  const entry = getStoreCatalogEntry(slug);
  if (!entry) return false;
  if (entry.category === "support") return false;
  return entry.giftable !== false;
}

export function isPremiumGiftable(plan: "monthly" | "lifetime"): boolean {
  return plan === "monthly" || plan === "lifetime";
}

export async function validateGiftRecipient(input: {
  recipientUsername: string;
  buyerUserId: string;
  buyerUsername?: string | null;
  target: GiftProductTarget;
}): Promise<GiftValidationResult> {
  const normalized = input.recipientUsername.trim().toLowerCase();
  if (!normalized) {
    return { ok: false, error: "Enter a recipient username." };
  }

  if (input.buyerUsername && normalized === input.buyerUsername.trim().toLowerCase()) {
    return { ok: false, error: "You cannot gift an item to yourself." };
  }

  const recipientId = await getProfileIdByUsername(normalized);
  if (!recipientId) {
    return { ok: false, error: "User not found. Check the username and try again." };
  }

  if (recipientId === input.buyerUserId) {
    return { ok: false, error: "You cannot gift an item to yourself." };
  }

  if (input.target.kind === "store") {
    const entry = getStoreCatalogEntry(input.target.productSlug);
    if (!entry) {
      return { ok: false, error: "Product not available." };
    }
    if (!isStoreProductGiftable(input.target.productSlug)) {
      return { ok: false, error: "This product cannot be gifted." };
    }

    if (input.target.productSlug === "verified-badge") {
      if (await recipientHasVerifiedBadge(recipientId)) {
        return { ok: false, error: "This user already owns Verified Badge." };
      }
    }

    if (input.target.productSlug === "animated-badge") {
      if (await recipientHasStoreProduct(recipientId, "animated-badge")) {
        return { ok: false, error: "This user already owns Animated Badge." };
      }
    }
  }

  if (input.target.kind === "premium") {
    if (!isPremiumGiftable(input.target.plan)) {
      return { ok: false, error: "This plan cannot be gifted." };
    }

    const premium = await recipientPremiumState(recipientId);
    if (input.target.plan === "lifetime" && premium.lifetime) {
      return { ok: false, error: "This user already owns Lifetime Premium." };
    }
  }

  return { ok: true, recipientId, recipientUsername: normalized };
}
