import type { Purchase } from "@/lib/types/store";

export type PurchaseWithCustomer = Purchase & {
  username: string | null;
  email: string | null;
  display_name: string | null;
  is_gift?: boolean;
  sender_username?: string | null;
  recipient_username?: string | null;
  gift_message?: string | null;
};

export type PurchaseStats = {
  totalRevenue: number;
  revenueToday: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  totalPurchases: number;
  refundCount: number;
  supportDonations: number;
  averageOrderValue: number;
};

export function searchPurchases(
  purchases: PurchaseWithCustomer[],
  query: string,
): PurchaseWithCustomer[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return purchases;

  return purchases.filter((purchase) => {
    const haystack = [
      purchase.reference_id,
      purchase.stripe_payment_intent,
      purchase.stripe_checkout_session_id,
      purchase.username,
      purchase.email,
      purchase.product_name,
      purchase.product_slug,
      purchase.stripe_customer_id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });
}

export function formatPurchaseAmount(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

export function formatPurchaseStatus(status: string): string {
  switch (status) {
    case "completed":
      return "Paid";
    case "refunded":
      return "Refunded";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}
