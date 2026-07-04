import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminSupportInbox } from "@/components/admin/admin-support-inbox";
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

export default async function AdminSupportPage() {
  const access = await getAdminAccess();
  if (!access) redirect("/dashboard");

  let conversations: SupportConversation[] = [];
  let analytics = EMPTY_ANALYTICS;
  let staffProfiles: Awaited<ReturnType<typeof listStaffProfiles>> = [];
  let setupError: string | null = null;

  try {
    [conversations, analytics, staffProfiles] = await Promise.all([
      listAdminSupportConversations(access.userId),
      getSupportAnalytics(),
      listStaffProfiles(),
    ]);
  } catch (error) {
    setupError =
      error instanceof Error
        ? error.message
        : "Support inbox failed to load. Run supabase/v77_support_system.sql if tables are missing.";
  }

  return (
    <>
      <AdminPageHeader
        title="Support Inbox"
        description="Private customer tickets with realtime replies, assignment, and internal staff notes."
      />
      {setupError ? (
        <div className="bf-card mb-6 border-amber-500/20 bg-amber-500/[0.06] p-5 text-sm text-amber-100">
          <p className="font-medium text-white">Support inbox could not load</p>
          <p className="mt-2 text-amber-100/80">{setupError}</p>
          <p className="mt-2 text-xs text-amber-200/60">
            If this is a new install, apply{" "}
            <code className="rounded bg-black/30 px-1 py-0.5">supabase/v77_support_system.sql</code>{" "}
            in the Supabase SQL editor, then reload.
          </p>
        </div>
      ) : null}
      <AdminSupportInbox
        initialConversations={conversations}
        analytics={analytics}
        staffProfiles={staffProfiles}
        staffUserId={access.userId}
      />
    </>
  );
}
