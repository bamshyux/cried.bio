/** Data-driven store catalog — add a Stripe Price ID + entry here to ship a new product. */
export type StoreFulfillmentAction =
  | "grant_verified_badge"
  | "grant_donor_badge"
  | "contact_support";

export type StoreCatalogEntry = {
  slug: string;
  name: string;
  description: string;
  features: string[];
  icon: string;
  stripeProductId: string;
  stripePriceId: string;
  fulfillmentKey: string;
  fulfillmentAction: StoreFulfillmentAction;
  badgeLabel?: "Popular" | "New";
  category: "badges" | "support";
  sortOrder: number;
  /** Repeat purchases allowed (support tiers). */
  allowRepeatPurchase?: boolean;
};

export const STORE_CATALOG: StoreCatalogEntry[] = [
  {
    slug: "custom-badge-1",
    name: "1 Custom Badge",
    description: "Commission a unique badge designed for your profile.",
    features: [
      "One custom badge design",
      "Shown on your public profile",
      "Crafted by the cried.bio team",
    ],
    icon: "✦",
    stripeProductId: "prod_UwFJWSv6PIMg9C",
    stripePriceId: "price_1TwMobCZc2iqkh61qdNuBGk2",
    fulfillmentKey: "custom_badge_1",
    fulfillmentAction: "contact_support",
    category: "badges",
    sortOrder: 10,
  },
  {
    slug: "verified-badge",
    name: "Verified Badge",
    description: "Official verification badge with increased trust on your profile.",
    features: [
      "Verified badge on your profile",
      "Increased trust and credibility",
      "Premium badge included if needed",
    ],
    icon: "✓",
    stripeProductId: "prod_UwqcyeUYdobfCb",
    stripePriceId: "price_1Twwv1CZc2iqkh61DgApIM3H",
    fulfillmentKey: "verified_badge",
    fulfillmentAction: "grant_verified_badge",
    badgeLabel: "Popular",
    category: "badges",
    sortOrder: 20,
  },
  {
    slug: "custom-badges-3",
    name: "3 Custom Badges",
    description: "Three custom badge designs for your profile.",
    features: [
      "Three unique badge designs",
      "Mix styles and themes",
      "Crafted by the cried.bio team",
    ],
    icon: "★",
    stripeProductId: "prod_Uwqf6eE4bTsJC2",
    stripePriceId: "price_1TwwxpCZc2iqkh61AQth3Daf",
    fulfillmentKey: "custom_badges_3",
    fulfillmentAction: "contact_support",
    category: "badges",
    sortOrder: 30,
  },
  {
    slug: "animated-badge",
    name: "Animated Badge",
    description: "A custom animated badge with motion effects for your profile.",
    features: [
      "Custom animated badge design",
      "Motion effects on your profile",
      "Crafted by the cried.bio team",
    ],
    icon: "◈",
    stripeProductId: "prod_UwqjCw4XFPfqS1",
    stripePriceId: "price_1Twx1mCZc2iqkh61bJ5rlvzD",
    fulfillmentKey: "animated_badge",
    fulfillmentAction: "contact_support",
    badgeLabel: "New",
    category: "badges",
    sortOrder: 40,
  },
  {
    slug: "support-1",
    name: "Support cried.bio",
    description: "Help keep cried.bio running and unlock the Donor badge.",
    features: ["Donor badge on your profile", "Supports cried.bio development"],
    icon: "♥",
    stripeProductId: "prod_Uwquo0kqIHm54X",
    stripePriceId: "price_1TwxCGCZc2iqkh61xHPJuO4G",
    fulfillmentKey: "support_donation",
    fulfillmentAction: "grant_donor_badge",
    category: "support",
    sortOrder: 100,
    allowRepeatPurchase: true,
  },
  {
    slug: "support-2",
    name: "Support cried.bio",
    description: "Help keep cried.bio running and unlock the Donor badge.",
    features: ["Donor badge on your profile", "Supports cried.bio development"],
    icon: "♥",
    stripeProductId: "prod_UwquIZpZArqqrl",
    stripePriceId: "price_1TwxCaCZc2iqkh616kx3dT3I",
    fulfillmentKey: "support_donation",
    fulfillmentAction: "grant_donor_badge",
    category: "support",
    sortOrder: 110,
    allowRepeatPurchase: true,
  },
  {
    slug: "support-5",
    name: "Support cried.bio",
    description: "Help keep cried.bio running and unlock the Donor badge.",
    features: ["Donor badge on your profile", "Supports cried.bio development"],
    icon: "♥",
    stripeProductId: "prod_Uwqyd84oibRfYQ",
    stripePriceId: "price_1TwxGwCZc2iqkh61ipJKleHn",
    fulfillmentKey: "support_donation",
    fulfillmentAction: "grant_donor_badge",
    category: "support",
    sortOrder: 120,
    allowRepeatPurchase: true,
  },
  {
    slug: "support-10",
    name: "Support cried.bio",
    description: "Help keep cried.bio running and unlock the Donor badge.",
    features: ["Donor badge on your profile", "Supports cried.bio development"],
    icon: "♥",
    stripeProductId: "prod_UwqzO7zmHFErYH",
    stripePriceId: "price_1TwxHrCZc2iqkh61p0YtDOMT",
    fulfillmentKey: "support_donation",
    fulfillmentAction: "grant_donor_badge",
    category: "support",
    sortOrder: 130,
    allowRepeatPurchase: true,
  },
];

const catalogBySlug = new Map(STORE_CATALOG.map((entry) => [entry.slug, entry]));
const catalogByPriceId = new Map(STORE_CATALOG.map((entry) => [entry.stripePriceId, entry]));

export function getStoreCatalogEntry(slug: string): StoreCatalogEntry | null {
  return catalogBySlug.get(slug) ?? null;
}

export function getStoreCatalogEntryByPriceId(priceId: string): StoreCatalogEntry | null {
  return catalogByPriceId.get(priceId) ?? null;
}

export function getActiveStoreCatalog(): StoreCatalogEntry[] {
  return [...STORE_CATALOG].sort((a, b) => a.sortOrder - b.sortOrder);
}
