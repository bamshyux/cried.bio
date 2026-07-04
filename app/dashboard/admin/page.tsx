import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-ui";
import { AdminSupportQuickLink } from "@/components/admin/admin-support-quick-link";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { getPlatformStats } from "@/lib/data/admin";
import { getAdminSupportUnreadTotal } from "@/lib/data/support";

export default async function AdminDashboardPage() {
  const stats = await getPlatformStats();
  const access = await getAdminAccess();
  let supportUnread = 0;
  if (access) {
    try {
      supportUnread = await getAdminSupportUnreadTotal(access.userId);
    } catch {
      supportUnread = 0;
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Admin Dashboard"
        description="Platform overview and quick stats for cried.bio."
      />

      <div className="mb-6">
        <AdminSupportQuickLink initialUnread={supportUnread} />
      </div>

      {!stats ? (
        <div className="bf-card p-6 text-sm text-neutral-400">
          Run <code className="rounded bg-white/[0.06] px-1.5 py-0.5">supabase/v44_admin_system.sql</code> in Supabase to enable admin stats.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label="Total Users" value={stats.total_users} />
          <AdminStatCard label="New Users Today" value={stats.new_users_today} />
          <AdminStatCard label="Active Users Today" value={stats.active_users_today} />
          <AdminStatCard label="Total Profile Views" value={stats.total_profile_views.toLocaleString()} />
          <AdminStatCard label="Guestbook Posts" value={stats.total_guestbook_posts} />
          <AdminStatCard label="Profiles Created" value={stats.total_profiles_created} />
          <AdminStatCard label="Badges Granted" value={stats.total_badges_granted} />
        </div>
      )}
    </>
  );
}
