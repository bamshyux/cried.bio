"use client";

import dynamic from "next/dynamic";
import type { SupportAnalytics, SupportConversation, SupportProfileSummary } from "@/lib/types/support";

const AdminSupportInbox = dynamic(
  () =>
    import("@/components/admin/admin-support-inbox").then((mod) => ({
      default: mod.AdminSupportInbox,
    })),
  {
    loading: () => (
      <div className="bf-card flex min-h-[420px] items-center justify-center p-8 text-sm text-neutral-500">
        Loading support inbox…
      </div>
    ),
  },
);

export function AdminSupportInboxClient({
  initialConversations,
  analytics,
  staffProfiles,
  staffUserId,
}: {
  initialConversations: SupportConversation[];
  analytics: SupportAnalytics;
  staffProfiles: SupportProfileSummary[];
  staffUserId: string;
}) {
  return (
    <AdminSupportInbox
      initialConversations={initialConversations}
      analytics={analytics}
      staffProfiles={staffProfiles}
      staffUserId={staffUserId}
    />
  );
}
