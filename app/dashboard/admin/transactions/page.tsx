import { redirect } from "next/navigation";
import { OwnerTransactionsClient } from "@/components/admin/owner-transactions-client";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { getPurchaseStats, listAllPurchasesAdmin } from "@/lib/data/purchases";

export default async function OwnerTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const access = await getAdminAccess();
  if (!access) redirect("/dashboard");
  if (access.role !== "owner") redirect("/dashboard/admin");

  const [purchases, stats] = await Promise.all([listAllPurchasesAdmin(), getPurchaseStats()]);
  const params = await searchParams;

  return (
    <OwnerTransactionsClient
      purchases={purchases}
      stats={stats}
      initialReference={params.ref ?? null}
    />
  );
}
