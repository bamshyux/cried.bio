export type StoreBadgeCreditType = "static_single" | "static_triple" | "animated_single";

export type StoreBadgeCredit = {
  id: string;
  user_id: string;
  purchase_id: string;
  credit_type: StoreBadgeCreditType;
  slots_total: number;
  slots_used: number;
  created_at: string;
  completed_at: string | null;
};

export type StoreBadgeCreationRoute = "static" | "static-pack" | "animated";

const CREDIT_TYPE_BY_ROUTE: Record<StoreBadgeCreationRoute, StoreBadgeCreditType> = {
  static: "static_single",
  "static-pack": "static_triple",
  animated: "animated_single",
};

const ROUTE_BY_CREDIT_TYPE: Record<StoreBadgeCreditType, StoreBadgeCreationRoute> = {
  static_single: "static",
  static_triple: "static-pack",
  animated_single: "animated",
};

const SLOTS_BY_FULFILLMENT_KEY: Record<string, { creditType: StoreBadgeCreditType; slots: number }> = {
  custom_badge_1: { creditType: "static_single", slots: 1 },
  custom_badges_3: { creditType: "static_triple", slots: 3 },
  animated_badge: { creditType: "animated_single", slots: 1 },
};

export function getBadgeCreationPathForProductSlug(productSlug: string): string | null {
  switch (productSlug) {
    case "custom-badge-1":
      return "/dashboard/store/create-badge/static";
    case "custom-badges-3":
      return "/dashboard/store/create-badge/static-pack";
    case "animated-badge":
      return "/dashboard/store/create-badge/animated";
    default:
      return null;
  }
}

export function getCreditTypeForRoute(route: StoreBadgeCreationRoute): StoreBadgeCreditType {
  return CREDIT_TYPE_BY_ROUTE[route];
}

export function getRouteForCreditType(creditType: StoreBadgeCreditType): StoreBadgeCreationRoute {
  return ROUTE_BY_CREDIT_TYPE[creditType];
}

export function getCreditGrantForFulfillmentKey(
  fulfillmentKey: string,
): { creditType: StoreBadgeCreditType; slots: number } | null {
  return SLOTS_BY_FULFILLMENT_KEY[fulfillmentKey] ?? null;
}
