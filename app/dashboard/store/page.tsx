import { Suspense } from "react";
import { redirect } from "next/navigation";
import { StorePageClient } from "@/components/store/store-page-client";
import { getOwnedStoreProductSlugs } from "@/lib/data/store";
import { getActiveStoreCatalog } from "@/lib/store/catalog";
import { listPendingBadgeCredits } from "@/lib/store/badge-credits";
import { fetchStorePriceDisplays } from "@/lib/stripe/store-prices";
import { getStripeCheckoutConfigStatus, getStripeConfigError } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardStorePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const stripeStatus = getStripeCheckoutConfigStatus();

  const [products, prices, ownedSlugs, pendingCredits] = await Promise.all([
    Promise.resolve(getActiveStoreCatalog()),
    fetchStorePriceDisplays(),
    getOwnedStoreProductSlugs(userId),
    listPendingBadgeCredits(userId),
  ]);

  return (
    <Suspense fallback={<div className="text-neutral-500">Loading…</div>}>
      <StorePageClient
        products={products}
        prices={prices}
        ownedSlugs={[...ownedSlugs]}
        pendingCredits={pendingCredits}
        stripeConfigured={stripeStatus.configured}
        stripeConfigError={getStripeConfigError(stripeStatus)}
      />
    </Suspense>
  );
}
