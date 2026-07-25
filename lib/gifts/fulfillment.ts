import { createNotification } from "@/lib/data/notifications";
import { syncGifterBadge } from "@/lib/store/fulfillment";
import { generateUniquePurchaseReferenceId } from "@/lib/store/reference-id";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GiftStatus } from "@/lib/types/gift";

async function adminDb() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable.");
  return supabase;
}

export async function awardGifterBadgeIfFirst(senderUserId: string): Promise<void> {
  const supabase = await adminDb();
  const { count } = await supabase
    .from("gifts")
    .select("id", { count: "exact", head: true })
    .eq("sender_user_id", senderUserId)
    .eq("status", "completed");

  if (count === 1) {
    await syncGifterBadge(senderUserId);
  }
}

export async function createGiftRecord(input: {
  senderUserId: string;
  recipientUserId: string;
  purchaseId?: string | null;
  referenceId?: string;
  productId?: string | null;
  productSlug: string;
  productName: string;
  giftMessage?: string | null;
  status?: GiftStatus;
}): Promise<{ id: string; referenceId: string }> {
  const supabase = await adminDb();
  const referenceId = input.referenceId ?? (await generateUniquePurchaseReferenceId());
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("gifts")
    .insert({
      sender_user_id: input.senderUserId,
      recipient_user_id: input.recipientUserId,
      purchase_id: input.purchaseId ?? null,
      reference_id: referenceId,
      product_id: input.productId ?? null,
      product_slug: input.productSlug,
      product_name: input.productName,
      gift_message: input.giftMessage?.trim() || null,
      status: input.status ?? "completed",
      accepted_at: input.status === "completed" || !input.status ? now : null,
    })
    .select("id, reference_id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: existing } = await supabase
        .from("gifts")
        .select("id, reference_id")
        .eq("reference_id", referenceId)
        .maybeSingle();
      if (existing) {
        return { id: String(existing.id), referenceId: String(existing.reference_id) };
      }
    }
    throw new Error(error.message);
  }

  return { id: String(data.id), referenceId: String(data.reference_id) };
}

export async function notifyGiftReceived(input: {
  recipientUserId: string;
  senderUserId: string;
  senderDisplayName: string;
  productName: string;
  giftMessage?: string | null;
  referenceId: string;
}): Promise<void> {
  const supabase = await adminDb();
  const { data: sender } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", input.senderUserId)
    .maybeSingle();

  const senderLabel =
    input.senderDisplayName ||
    sender?.display_name ||
    (sender?.username ? `@${sender.username}` : "Someone");

  const isPremium = input.productName.toLowerCase().includes("premium");
  const displayProduct = isPremium
    ? "Premium Lite"
    : input.productName.replace(/\s*\(Monthly\)\s*/i, "").replace(/\s*\(Lifetime\)\s*/i, "");
  const verb = isPremium ? "gifted you" : "sent you";
  const title = `🎁 ${senderLabel} ${verb} ${displayProduct}!`;
  const body = input.giftMessage?.trim() || "";

  await createNotification({
    userId: input.recipientUserId,
    type: "gift_received",
    title,
    body,
    actorId: input.senderUserId,
    data: {
      reference_id: input.referenceId,
      product_name: input.productName,
      gift_message: input.giftMessage?.trim() || null,
      toast: true,
    },
  });
}

export async function completeGiftFulfillment(input: {
  senderUserId: string;
  recipientUserId: string;
  purchaseId?: string | null;
  referenceId?: string;
  productId?: string | null;
  productSlug: string;
  productName: string;
  giftMessage?: string | null;
}): Promise<{ giftId: string; referenceId: string }> {
  const supabase = await adminDb();

  if (input.purchaseId) {
    const { data: existingGift } = await supabase
      .from("gifts")
      .select("id, reference_id")
      .eq("purchase_id", input.purchaseId)
      .maybeSingle();
    if (existingGift?.id) {
      return {
        giftId: String(existingGift.id),
        referenceId: String(existingGift.reference_id),
      };
    }
  }

  const gift = await createGiftRecord({
    senderUserId: input.senderUserId,
    recipientUserId: input.recipientUserId,
    purchaseId: input.purchaseId,
    referenceId: input.referenceId,
    productId: input.productId,
    productSlug: input.productSlug,
    productName: input.productName,
    giftMessage: input.giftMessage,
    status: "completed",
  });

  const { data: sender } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", input.senderUserId)
    .maybeSingle();

  const senderDisplayName = sender?.display_name || sender?.username || "Someone";

  await notifyGiftReceived({
    recipientUserId: input.recipientUserId,
    senderUserId: input.senderUserId,
    senderDisplayName,
    productName: input.productName,
    giftMessage: input.giftMessage,
    referenceId: gift.referenceId,
  });

  await awardGifterBadgeIfFirst(input.senderUserId);

  return { giftId: gift.id, referenceId: gift.referenceId };
}
