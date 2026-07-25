import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Gift, GiftWithProfiles } from "@/lib/types/gift";

async function db() {
  return createAdminClient() ?? (await createClient());
}

function mapGift(row: Record<string, unknown>): Gift {
  return {
    id: String(row.id),
    sender_user_id: String(row.sender_user_id),
    recipient_user_id: String(row.recipient_user_id),
    purchase_id: (row.purchase_id as string | null) ?? null,
    reference_id: String(row.reference_id),
    product_id: (row.product_id as string | null) ?? null,
    product_slug: String(row.product_slug),
    product_name: String(row.product_name),
    gift_message: (row.gift_message as string | null) ?? null,
    status: row.status as Gift["status"],
    accepted_at: (row.accepted_at as string | null) ?? null,
    created_at: String(row.created_at),
  };
}

async function enrichGifts(gifts: Gift[]): Promise<GiftWithProfiles[]> {
  if (gifts.length === 0) return [];

  const profileIds = [
    ...new Set(gifts.flatMap((gift) => [gift.sender_user_id, gift.recipient_user_id])),
  ];

  const supabase = await db();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", profileIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [String(profile.id), profile as Record<string, unknown>]),
  );

  return gifts.map((gift) => {
    const sender = profileMap.get(gift.sender_user_id);
    const recipient = profileMap.get(gift.recipient_user_id);
    return {
      ...gift,
      sender_username: sender ? String(sender.username ?? "") || null : null,
      sender_display_name: sender ? String(sender.display_name ?? "") || null : null,
      recipient_username: recipient ? String(recipient.username ?? "") || null : null,
      recipient_display_name: recipient ? String(recipient.display_name ?? "") || null : null,
    };
  });
}

export async function listReceivedGifts(userId: string, limit = 50): Promise<GiftWithProfiles[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("gifts")
    .select("*")
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return enrichGifts((data ?? []).map((row) => mapGift(row as Record<string, unknown>)));
}

export async function listSentGifts(userId: string, limit = 50): Promise<GiftWithProfiles[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("gifts")
    .select("*")
    .eq("sender_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return enrichGifts((data ?? []).map((row) => mapGift(row as Record<string, unknown>)));
}

export async function getGiftByReferenceId(referenceId: string): Promise<Gift | null> {
  const supabase = await db();
  const { data } = await supabase
    .from("gifts")
    .select("*")
    .eq("reference_id", referenceId.toUpperCase())
    .maybeSingle();

  return data ? mapGift(data as Record<string, unknown>) : null;
}

export async function getGiftByPurchaseId(purchaseId: string): Promise<Gift | null> {
  const supabase = await db();
  const { data } = await supabase
    .from("gifts")
    .select("*")
    .eq("purchase_id", purchaseId)
    .maybeSingle();

  return data ? mapGift(data as Record<string, unknown>) : null;
}

export async function searchUsernames(query: string, limit = 6): Promise<
  Array<{ username: string; display_name: string | null }>
> {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  const supabase = await db();
  const { data } = await supabase
    .from("profiles")
    .select("username, display_name")
    .not("username", "is", null)
    .ilike("username", `${needle}%`)
    .order("username", { ascending: true })
    .limit(limit);

  return (data ?? [])
    .filter((row) => row.username)
    .map((row) => ({
      username: String(row.username),
      display_name: (row.display_name as string | null) ?? null,
    }));
}

export async function getUnreadGiftNotifications(userId: string, sinceIso?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select("id, title, body, data, created_at")
    .eq("user_id", userId)
    .eq("type", "gift_received")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(3);

  if (sinceIso) {
    query = query.gt("created_at", sinceIso);
  }

  const { data } = await query;
  return data ?? [];
}
