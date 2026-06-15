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
      <div className="bf-card space-y-3 p-6 text-sm">
        <p className="text-red-400">Failed to load accounts: {error}</p>
        {error.includes("v20_admin_accounts") && (
          <p className="text-neutral-500">
            Open Supabase Dashboard → SQL Editor → paste and run{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-neutral-300">
              supabase/v20_admin_accounts.sql
            </code>
            , then refresh this page.
          </p>
        )}
      </div>
    );
  }

  return <AdminAccountsPageShell accounts={accounts ?? []} />;
}
