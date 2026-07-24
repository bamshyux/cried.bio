import { redirect } from "next/navigation";
import { AnalyticsPageShell } from "@/components/dashboard/analytics-dashboard";
import { getAnalyticsBundle } from "@/lib/data/analytics";
import { getUserEntitlements } from "@/lib/premium/entitlements";
import { createClient } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const [{ summary, premium }, entitlements] = await Promise.all([
    getAnalyticsBundle(userId),
    getUserEntitlements(userId),
  ]);

  return (
    <AnalyticsPageShell
      summary={summary}
      premium={premium}
      hasAdvancedAnalytics={entitlements.advanced_analytics}
    />
  );
}
