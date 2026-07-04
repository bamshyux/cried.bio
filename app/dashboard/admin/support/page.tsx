import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminSupportInbox } from "@/components/admin/admin-support-inbox";
import { getAdminAccess } from "@/lib/auth/admin-access";
import {
  getSupportAnalytics,
  listAdminSupportConversations,
  listStaffProfiles,
} from "@/lib/data/support";
import { redirect } from "next/navigation";

export default async function AdminSupportPage() {
  const access = await getAdminAccess();
  if (!access) redirect("/dashboard");

  const [conversations, analytics, staffProfiles] = await Promise.all([
    listAdminSupportConversations(access.userId),
    getSupportAnalytics(),
    listStaffProfiles(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Support Inbox"
        description="Private customer tickets with realtime replies, assignment, and internal staff notes."
      />
      <AdminSupportInbox
        initialConversations={conversations}
        analytics={analytics}
        staffProfiles={staffProfiles}
        staffUserId={access.userId}
      />
    </>
  );
}
