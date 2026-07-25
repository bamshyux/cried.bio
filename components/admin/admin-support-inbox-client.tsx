"use client";

import { Component, type ReactNode } from "react";
import { AdminSupportInbox } from "@/components/admin/admin-support-inbox";
import type { SupportAnalytics, SupportConversation, SupportProfileSummary } from "@/lib/types/support";

const EMPTY_ANALYTICS: SupportAnalytics = {
  openCount: 0,
  closedCount: 0,
  waitingOnStaff: 0,
  waitingOnUser: 0,
  inProgress: 0,
  aiAssisting: 0,
  avgFirstResponseMinutes: null,
  resolvedThisWeek: 0,
  closedToday: 0,
  archivedTranscriptCount: 0,
  aiResolutionRate: null,
  humanResolutionRate: null,
  avgAiConversationLength: null,
  avgHumanResponseMinutes: null,
  avgResolutionMinutes: null,
  aiEscalationPercentage: null,
};

class SupportInboxErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bf-card border-red-500/20 bg-red-500/[0.06] p-6">
          <p className="font-medium text-white">Support inbox crashed</p>
          <p className="mt-2 text-sm text-red-200/80">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#090909]"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  const safeAnalytics = analytics ?? EMPTY_ANALYTICS;
  const safeConversations = Array.isArray(initialConversations) ? initialConversations : [];
  const safeStaff = Array.isArray(staffProfiles) ? staffProfiles : [];

  return (
    <SupportInboxErrorBoundary>
      <AdminSupportInbox
        initialConversations={safeConversations}
        analytics={safeAnalytics}
        staffProfiles={safeStaff}
        staffUserId={staffUserId}
      />
    </SupportInboxErrorBoundary>
  );
}
