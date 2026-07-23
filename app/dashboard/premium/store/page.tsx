import { Suspense } from "react";
import { redirect } from "next/navigation";
import { StorePageClient } from "@/components/premium/store-page-client";
import { getOwnedStoreProductSlugs, getStoreProducts } from "@/lib/data/store";
import { getStripeCheckoutConfigStatus, getStripeConfigError } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPremiumStorePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const stripeStatus = getStripeCheckoutConfigStatus();

  const [products, ownedSlugs, profileRow] = await Promise.all([
    getStoreProducts(),
    getOwnedStoreProductSlugs(userId),
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
  ]);

  return (
    <Suspense fallback={<div className="text-neutral-500">Loading…</div>}>
      <StorePageClient
        products={products}
        ownedSlugs={[...ownedSlugs]}
        buyerUsername={profileRow.data?.username ?? null}
        stripeConfigured={stripeStatus.configured}
        stripeConfigError={getStripeConfigError(stripeStatus)}
      />
    </Suspense>
  );
}
