import { redirect } from "next/navigation";
import { PurchaseHistoryClient } from "@/components/store/store-page-client";
import { listPurchasesForUser } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardStoreHistoryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const purchases = await listPurchasesForUser(userId);

  return <PurchaseHistoryClient purchases={purchases} />;
}
