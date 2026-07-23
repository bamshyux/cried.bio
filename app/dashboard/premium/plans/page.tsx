import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PremiumPageClient } from "@/components/premium/premium-page-client";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { getStripeCustomerId } from "@/lib/data/premium-subscription";
import { getStripeCheckoutConfigStatus, getStripeConfigError } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPremiumPlansPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const stripeStatus = getStripeCheckoutConfigStatus();
  const [entitlements, customerId, profile] = await Promise.all([
    getUserEntitlements(userId),
    getStripeCustomerId(userId),
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
  ]);

  return (
    <Suspense fallback={<div className="text-neutral-500">Loading…</div>}>
      <PremiumPageClient
        entitlements={entitlements}
        hasStripeCustomer={Boolean(customerId)}
        stripeConfigured={stripeStatus.configured}
        stripeConfigError={getStripeConfigError(stripeStatus)}
        buyerUsername={profile.data?.username ?? null}
      />
    </Suspense>
  );
}
