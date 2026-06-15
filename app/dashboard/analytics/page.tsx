import { redirect } from "next/navigation";
import { AnalyticsPageShell } from "@/components/dashboard/analytics-dashboard";
import { getAnalyticsSummary } from "@/lib/data/analytics";
import { createClient } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const summary = await getAnalyticsSummary(data.claims.sub as string);
  return <AnalyticsPageShell summary={summary} />;
}
