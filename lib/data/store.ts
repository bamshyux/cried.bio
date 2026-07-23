import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ProfileStoreEntitlements, StoreProduct, StorePurchase } from "@/lib/types/store";

async function db() {
  return createAdminClient() ?? (await createClient());
}

function mapProduct(row: Record<string, unknown>): StoreProduct {
  const features = row.features;
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ""),
    features: Array.isArray(features) ? features.map(String) : [],
    icon: String(row.icon ?? "✦"),
    price_cents: Number(row.price_cents) || 0,
    stripe_price_id: (row.stripe_price_id as string | null) ?? null,
    badge_label: (row.badge_label as StoreProduct["badge_label"]) ?? null,
    status: row.status as StoreProduct["status"],
    is_giftable: Boolean(row.is_giftable),
    is_visible: Boolean(row.is_visible),
    sort_order: Number(row.sort_order) || 0,
    fulfillment_key: String(row.fulfillment_key),
    badge_slug: (row.badge_slug as string | null) ?? null,
  };
}

export async function getStoreProducts(options?: {
  includeArchived?: boolean;
}): Promise<StoreProduct[]> {
  const supabase = await db();
  let query = supabase.from("store_products").select("*").order("sort_order", { ascending: true });

  if (!options?.includeArchived) {
    query = query.in("status", ["active", "coming_soon"]).eq("is_visible", true);
  }

  const { data } = await query;
  return (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
}

export async function getStoreProductBySlug(slug: string): Promise<StoreProduct | null> {
  const supabase = await db();
  const { data } = await supabase.from("store_products").select("*").eq("slug", slug).maybeSingle();
  return data ? mapProduct(data as Record<string, unknown>) : null;
}

export async function getOwnedStoreProductSlugs(profileId: string): Promise<Set<string>> {
  const supabase = await db();
  const { data } = await supabase
    .from("store_purchases")
    .select("product_slug")
    .eq("recipient_profile_id", profileId)
    .not("fulfilled_at", "is", null);

  return new Set((data ?? []).map((row) => row.product_slug as string));
}

export async function getProfileStoreEntitlements(
  profileId: string,
): Promise<ProfileStoreEntitlements | null> {
  const supabase = await db();
  const { data } = await supabase
    .from("profile_store_entitlements")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!data) return null;
  return data as ProfileStoreEntitlements;
}

export async function listStorePurchasesForProfile(profileId: string): Promise<StorePurchase[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("store_purchases")
    .select("*")
    .or(`buyer_profile_id.eq.${profileId},recipient_profile_id.eq.${profileId}`)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []) as StorePurchase[];
}

export async function getProfileIdByUsername(username: string): Promise<string | null> {
  const supabase = await db();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();
  return data?.id ?? null;
}

export async function listStoreProductsAdmin(): Promise<StoreProduct[]> {
  const supabase = await db();
  const { data } = await supabase.from("store_products").select("*").order("sort_order", { ascending: true });
  return (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
}
