import { redirect } from "next/navigation";
import { listAdminAccountsAction } from "@/app/actions/admin-accounts";
import { AdminAccountsPageShell } from "@/components/dashboard/admin-accounts-editor";
import { requireSuperAdmin } from "@/lib/auth/super-admin";

export default async function ManageAccountsPage() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) redirect("/dashboard");

  const { accounts, error } = await listAdminAccountsAction();
  if (error) {
    return (
      <div className="bf-card p-6 text-sm text-red-400">
        Failed to load accounts: {error}
      </div>
    );
  }

  return <AdminAccountsPageShell accounts={accounts ?? []} />;
}
