import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { listAdminUsers } from "@/lib/data/admin";

export default async function AdminUsersPage() {
  const [users, access] = await Promise.all([listAdminUsers(""), getAdminAccess()]);
  return <AdminUsersPanel initialUsers={users} isOwner={access?.role === "owner"} />;
}
