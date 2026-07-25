export type GiftStatus = "pending" | "completed" | "failed" | "refunded";

export type Gift = {
  id: string;
  sender_user_id: string;
  recipient_user_id: string;
  purchase_id: string | null;
  reference_id: string;
  product_id: string | null;
  product_slug: string;
  product_name: string;
  gift_message: string | null;
  status: GiftStatus;
  accepted_at: string | null;
  created_at: string;
};

export type GiftWithProfiles = Gift & {
  sender_username: string | null;
  sender_display_name: string | null;
  recipient_username: string | null;
  recipient_display_name: string | null;
};

export type GiftProductTarget =
  | { kind: "store"; productSlug: string }
  | { kind: "premium"; plan: "monthly" | "lifetime" };

export type GiftValidationResult =
  | { ok: true; recipientId: string; recipientUsername: string }
  | { ok: false; error: string };
