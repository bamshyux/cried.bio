export type StoreProductStatus = "active" | "archived" | "coming_soon";

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  features: string[];
  icon: string;
  price_cents: number;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  badge_label: "Popular" | "New" | null;
  status: StoreProductStatus;
  is_giftable: boolean;
  is_visible: boolean;
  sort_order: number;
  fulfillment_key: string;
  badge_slug: string | null;
};

export type Purchase = {
  id: string;
  user_id: string;
  reference_id: string;
  stripe_checkout_session_id: string;
  stripe_payment_intent: string | null;
  stripe_customer_id: string | null;
  stripe_product_id: string | null;
  price_id: string;
  product_slug: string;
  product_name: string;
  amount_paid: number;
  currency: string;
  status: string;
  fulfillment_key: string;
  payment_method: string | null;
  receipt_number: string | null;
  invoice_number: string | null;
  created_at: string;
};

export type StorePurchase = {
  id: string;
  buyer_profile_id: string;
  recipient_profile_id: string;
  product_id: string | null;
  product_slug: string;
  amount_cents: number;
  is_gift: boolean;
  gift_message: string | null;
  fulfilled_at: string | null;
  created_at: string;
};

export type ProfileStoreEntitlements = {
  profile_id: string;
  extra_profile_pages: number;
  custom_badge_slots: number;
  can_create_custom_badge: boolean;
  theme_pack_unlocked: boolean;
  supporter_pack_active: boolean;
  profile_boost_expires_at: string | null;
};

export type GiftCheckoutTarget =
  | { kind: "store"; productSlug: string }
  | { kind: "premium"; plan: "monthly" | "lifetime" };
