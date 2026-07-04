import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminSupportInboxClient } from "@/components/admin/admin-support-inbox-client";
import { getAdminAccess } from "@/lib/auth/admin-access";
import {
  getSupportAnalytics,
  listAdminSupportConversations,
  listStaffProfiles,
} from "@/lib/data/support";
import type { SupportAnalytics, SupportConversation } from "@/lib/types/support";
import { redirect } from "next/navigation";

const EMPTY_ANALYTICS: SupportAnalytics = {
  openCount: 0,
  closedCount: 0,
  waitingOnStaff: 0,
  waitingOnUser: 0,
  avgFirstResponseMinutes: null,
  resolvedThisWeek: 0,
};

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    console.error(`[admin/support] ${label}:`, error);
    return fallback;
  }
}

export default async function AdminSupportPage() {
  const access = await getAdminAccess();
  if (!access) redirect("/dashboard");

  const conversations = await safeLoad(
    "listAdminSupportConversations",
    () => listAdminSupportConversations(access.userId),
    [] as SupportConversation[],
  );
  const analytics = await safeLoad(
    "getSupportAnalytics",
    () => getSupportAnalytics(),
    EMPTY_ANALYTICS,
  );
  const staffProfiles = await safeLoad(
    "listStaffProfiles",
    () => listStaffProfiles(),
    [] as Awaited<ReturnType<typeof listStaffProfiles>>,
  );

  return (
    <>
      <AdminPageHeader
        title="Support Inbox"
        description="Private customer tickets with realtime replies, assignment, and internal staff notes."
      />
      <AdminSupportInboxClient
        initialConversations={conversations}
        analytics={analytics}
        staffProfiles={staffProfiles}
        staffUserId={access.userId}
      />
    </>
  );
}
