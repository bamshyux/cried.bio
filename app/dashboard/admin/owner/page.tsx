import { AdminOwnerPanel } from "@/components/admin/admin-owner-panel";
import { getPlatformSettings, listReservedUsernames, getPlatformStats } from "@/lib/data/admin";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { redirect } from "next/navigation";

export default async function AdminOwnerPage() {
  const access = await getAdminAccess();
  if (!access || access.role !== "owner") redirect("/dashboard/admin");

  const [settings, reserved, stats] = await Promise.all([
    getPlatformSettings(),
    listReservedUsernames(),
    getPlatformStats(),
  ]);

  return <AdminOwnerPanel settings={settings} reserved={reserved} stats={stats} />;
}
