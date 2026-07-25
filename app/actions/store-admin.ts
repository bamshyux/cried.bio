"use server";

import { revalidatePath } from "next/cache";
import { logAdminAudit } from "@/lib/admin/audit";
import { requireAdminAccess } from "@/lib/auth/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminFormState } from "@/lib/types/admin";
import type { StoreProductStatus } from "@/lib/types/store";

async function guard() {
  const access = await requireAdminAccess("admin");
  if ("error" in access) return { error: access.error } as const;
  return { access } as const;
}

async function db() {
  return createAdminClient() ?? (await createClient());
}

function revalidateStore() {
  revalidatePath("/dashboard/store");
  revalidatePath("/dashboard/admin/store");
}

function parseFeatures(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export type StoreProductInput = {
  slug: string;
  name: string;
  description: string;
  features: string;
  icon: string;
  price_cents: number;
  stripe_price_id?: string | null;
  badge_label?: "Popular" | "New" | null;
  status: StoreProductStatus;
  is_giftable: boolean;
  is_visible: boolean;
  sort_order: number;
  fulfillment_key: string;
  badge_slug?: string | null;
};

export async function createStoreProductAction(input: StoreProductInput): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!slug || !input.name.trim() || !input.fulfillment_key.trim()) {
    return { error: "Slug, name, and fulfillment key are required." };
  }

  const supabase = await db();
  const { error } = await supabase.from("store_products").insert({
    slug,
    name: input.name.trim(),
    description: input.description.trim(),
    features: parseFeatures(input.features),
    icon: input.icon.trim() || "✦",
    price_cents: Math.max(0, Math.round(input.price_cents)),
    stripe_price_id: input.stripe_price_id?.trim() || null,
    badge_label: input.badge_label ?? null,
    status: input.status,
    is_giftable: input.is_giftable,
    is_visible: input.is_visible,
    sort_order: input.sort_order,
    fulfillment_key: input.fulfillment_key.trim(),
    badge_slug: input.badge_slug?.trim() || null,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    action: "store_product_created",
    details: { slug },
  });

  revalidateStore();
  return { success: "Store product created." };
}

export async function updateStoreProductAction(
  productId: string,
  input: StoreProductInput,
): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  const supabase = await db();
  const { error } = await supabase
    .from("store_products")
    .update({
      slug: input.slug.trim().toLowerCase(),
      name: input.name.trim(),
      description: input.description.trim(),
      features: parseFeatures(input.features),
      icon: input.icon.trim() || "✦",
      price_cents: Math.max(0, Math.round(input.price_cents)),
      stripe_price_id: input.stripe_price_id?.trim() || null,
      badge_label: input.badge_label ?? null,
      status: input.status,
      is_giftable: input.is_giftable,
      is_visible: input.is_visible,
      sort_order: input.sort_order,
      fulfillment_key: input.fulfillment_key.trim(),
      badge_slug: input.badge_slug?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) return { error: error.message };

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    action: "store_product_updated",
    details: { productId, slug: input.slug },
  });

  revalidateStore();
  return { success: "Store product updated." };
}

export async function archiveStoreProductAction(productId: string): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  const supabase = await db();
  const { error } = await supabase
    .from("store_products")
    .update({ status: "archived", is_visible: false, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) return { error: error.message };

  await logAdminAudit({
    actorId: gate.access.userId,
    actorEmail: gate.access.email,
    action: "store_product_archived",
    details: { productId },
  });

  revalidateStore();
  return { success: "Product archived." };
}

export async function toggleStoreProductVisibilityAction(
  productId: string,
  isVisible: boolean,
): Promise<AdminFormState> {
  const gate = await guard();
  if ("error" in gate) return { error: gate.error };

  const supabase = await db();
  const { error } = await supabase
    .from("store_products")
    .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidateStore();
  return { success: isVisible ? "Product is now visible." : "Product hidden." };
}
