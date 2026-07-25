import { getBadgeCreationPathForProductSlug } from "@/lib/store/badge-credits";

/** Where the original checkout tab should land after purchase (product setup). */
export function getPostCheckoutFulfillmentPath(productSlug: string): string {
  const badgePath = getBadgeCreationPathForProductSlug(productSlug);
  if (badgePath) return `${badgePath}?from_checkout=1`;

  switch (productSlug) {
    case "verified-badge":
      return "/dashboard/badges";
    default:
      return "/dashboard/settings?tab=billing";
  }
}

export function getPurchaseSuccessPath(referenceId: string): string {
  return `/dashboard/purchases/success/${encodeURIComponent(referenceId)}`;
}

export function getCheckoutCompleteSuccessUrl(siteUrl: string): string {
  return `${siteUrl}/dashboard/purchases/complete?session_id={CHECKOUT_SESSION_ID}`;
}
