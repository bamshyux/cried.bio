import { redirect } from "next/navigation";
import { getPremiumEntitlements, isPremiumUser } from "@/lib/data/premium";
import { createClient } from "@/lib/supabase/server";
import { cardClassName } from "@/components/dashboard/form-fields";
import { PREMIUM_ENTITLEMENTS } from "@/lib/types/premium";

export default async function DashboardPremiumPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [isPremium, entitlements] = await Promise.all([
    isPremiumUser(userId),
    getPremiumEntitlements(userId),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Premium</h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Premium billing is coming soon. Your account tier and entitlements are ready below.
        </p>
      </div>

      <div className={`${cardClassName} mb-6`}>
        <p className="text-sm text-neutral-400">Current tier</p>
        <p className="mt-1 text-2xl font-bold capitalize text-white">{isPremium ? "Premium" : "Free"}</p>
      </div>

      <div className={cardClassName}>
        <h2 className="mb-4 text-sm font-medium text-white">Entitlements</h2>
        <ul className="space-y-2 text-sm text-neutral-400">
          <li>Featured blocks: {entitlements.max_featured_blocks} (premium: {PREMIUM_ENTITLEMENTS.max_featured_blocks})</li>
          <li>Music slots: {entitlements.max_music_slots}</li>
          <li>Custom domains: {entitlements.custom_domain ? "Yes" : "No"}</li>
          <li>Animated effects: {entitlements.animated_effects ? "Yes" : "No"}</li>
          <li>Advanced analytics: {entitlements.advanced_analytics ? "Yes" : "No"}</li>
        </ul>
        <p className="mt-4 text-xs text-neutral-600">Payment processing will be added in a future update.</p>
      </div>
    </div>
  );
}
