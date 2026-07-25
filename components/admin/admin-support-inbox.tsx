"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  addSupportInternalNoteAction,
  assignSupportConversationAction,
  fetchAdminSupportDetailAction,
  fetchAdminSupportInboxAction,
  toggleSupportPinAction,
  toggleSupportPriorityAction,
  updateSupportStatusAction,
} from "@/app/actions/support";
import Link from "next/link";
import { AdminStatCard } from "@/components/admin/admin-ui";
import { SupportChatThread } from "@/components/support/support-chat-thread";
import { useSupportRealtime, useSupportTypingIndicator } from "@/hooks/use-support-realtime";
import {
  createSupportMessageSoundTracker,
  playSoundsForConversationMessages,
} from "@/lib/support/message-sounds";
import { formatSupportTimestamp, supportDisplayName } from "@/lib/support/format";
import {
  getSupportStatusDisplay,
  type SupportAiMessage,
  type SupportAnalytics,
  type SupportConversation,
  type SupportInternalNote,
  type SupportMessage,
  type SupportProfileSummary,
} from "@/lib/types/support";

export function AdminSupportInbox({
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
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [notes, setNotes] = useState<SupportInternalNote[]>([]);
  const [aiMessages, setAiMessages] = useState<SupportAiMessage[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const { typingLabel, handleTyping, clearTyping } = useSupportTypingIndicator();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedIdRef = useRef<string | null>(null);
  const backgroundSoundTrackerRef = useRef(createSupportMessageSoundTracker());

  selectedIdRef.current = selectedId;

  useEffect(() => {
    clearTyping();
  }, [selectedId, clearTyping]);

  const refreshInbox = useCallback(async () => {
    try {
      const result = await fetchAdminSupportInboxAction({
        status: statusFilter,
        assigned: assignedFilter,
        search,
        priorityOnly,
      });
      if (!result || "error" in result) return;
      setConversations(Array.isArray(result.conversations) ? result.conversations : []);
    } catch (error) {
      console.error("[admin/support] refreshInbox:", error);
    }
  }, [assignedFilter, priorityOnly, search, statusFilter]);

  const openConversation = useCallback(async (conversationId: string) => {
    setSelectedId(conversationId);
    const result = await fetchAdminSupportDetailAction(conversationId);
    if ("error" in result) {
      setFeedback(result.error ?? null);
      return;
    }
    setActiveConversation(result.conversation);
    setMessages(result.messages);
    setNotes(result.notes);
    setAiMessages("aiMessages" in result ? (result.aiMessages ?? []) : []);
    void refreshInbox();
  }, [refreshInbox]);

  const notifyBackgroundMessageSounds = useCallback(async (conversationId: string) => {
    await playSoundsForConversationMessages(
      conversationId,
      true,
      backgroundSoundTrackerRef.current,
      async (id) => fetchAdminSupportDetailAction(id),
    );
  }, []);

  useEffect(() => {
    void refreshInbox();
  }, [refreshInbox]);

  useSupportRealtime({
    userId: staffUserId,
    conversationId: selectedId,
    isStaff: true,
    enabled: true,
    onConversationChange: () => {
      void refreshInbox();
      const openId = selectedIdRef.current;
      if (openId) void openConversation(openId);
    },
    onMessageInsert: (conversationId) => {
      if (selectedIdRef.current === conversationId) {
        void openConversation(conversationId);
      } else {
        void refreshInbox();
        void notifyBackgroundMessageSounds(conversationId);
      }
    },
    onTyping: handleTyping,
  });

  const refreshActiveConversation = useCallback(async () => {
    const openId = selectedIdRef.current;
    if (openId) await openConversation(openId);
  }, [openConversation]);

  const handleTicketDeleted = useCallback(() => {
    setSelectedId(null);
    setActiveConversation(null);
    setMessages([]);
    setNotes([]);
    setAiMessages([]);
    void refreshInbox();
  }, [refreshInbox]);

  function run(action: () => Promise<{ error?: string; success?: string }>) {
    startTransition(async () => {
      setFeedback(null);
      const result = await action();
      setFeedback(result.error ?? result.success ?? null);
      if (selectedId) void openConversation(selectedId);
      void refreshInbox();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        <AdminStatCard label="Open tickets" value={analytics.openCount} />
        <AdminStatCard label="Waiting on staff" value={analytics.waitingOnStaff} />
        <AdminStatCard label="In progress" value={analytics.inProgress} />
        <AdminStatCard label="Closed today" value={analytics.closedToday} />
        <AdminStatCard
          label="AI resolution rate"
          value={analytics.aiResolutionRate != null ? `${analytics.aiResolutionRate}%` : "—"}
        />
        <AdminStatCard
          label="AI escalation rate"
          value={
            analytics.aiEscalationPercentage != null
              ? `${analytics.aiEscalationPercentage}%`
              : "—"
          }
        />
        <AdminStatCard
          label="Avg AI chat length"
          value={
            analytics.avgAiConversationLength != null
              ? `${analytics.avgAiConversationLength} msgs`
              : "—"
          }
        />
        <AdminStatCard
          label="Avg human response"
          value={
            analytics.avgHumanResponseMinutes != null
              ? `${analytics.avgHumanResponseMinutes}m`
              : "—"
          }
        />
        <AdminStatCard
          label="Avg resolution time"
          value={
            analytics.avgResolutionMinutes != null
              ? `${analytics.avgResolutionMinutes}m`
              : "—"
          }
        />
        <AdminStatCard label="Archived transcripts" value={analytics.archivedTranscriptCount} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/dashboard/admin/support/archives"
          className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-neutral-300 hover:bg-white/[0.04]"
        >
          Archived Transcripts →
        </Link>
      </div>

      <div className="bf-card overflow-hidden p-0">
        <div className="flex flex-wrap gap-2 border-b border-white/[0.06] p-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-3 py-2 text-sm text-neutral-300"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="waiting_on_staff">Waiting on staff</option>
            <option value="waiting_on_user">Waiting on customer</option>
            <option value="in_progress">In progress</option>
            <option value="ai_assisting">AI assisting</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-3 py-2 text-sm text-neutral-300"
          >
            <option value="all">All assignments</option>
            <option value="me">Assigned to me</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject…"
            className="min-w-[180px] flex-1 rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-3 py-2 text-sm text-neutral-300"
          />
          <label className="flex items-center gap-2 text-sm text-neutral-400">
            <input
              type="checkbox"
              checked={priorityOnly}
              onChange={(e) => setPriorityOnly(e.target.checked)}
            />
            Priority only
          </label>
        </div>

        {feedback ? <p className="border-b border-white/[0.06] px-4 py-2 text-xs text-neutral-400">{feedback}</p> : null}

        <div className="grid min-h-[640px] lg:grid-cols-[1fr_1.2fr_280px]">
          <div className="overflow-x-auto border-b border-white/[0.06] lg:border-b-0 lg:border-r">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.02] text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Last message</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conversation) => {
                  const selected = selectedId === conversation.id;
                  const status = getSupportStatusDisplay(conversation.status);
                  return (
                    <tr
                      key={conversation.id}
                      onClick={() => void openConversation(conversation.id)}
                      className={`cursor-pointer border-t border-white/[0.04] transition-colors hover:bg-white/[0.03] ${selected ? "bg-violet-500/[0.08]" : ""}`}
                    >
                      <td className="px-4 py-3 text-neutral-300">
                        {supportDisplayName(conversation.customer)}
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-white">
                        {conversation.is_priority ? "★ " : null}
                        {conversation.is_pinned ? "📌 " : null}
                        {conversation.subject}
                        {(conversation.unread_count ?? 0) > 0 ? (
                          <span className="ml-2 rounded-full bg-violet-500 px-1.5 py-0.5 text-[10px] text-white">
                            {conversation.unread_count}
                          </span>
                        ) : null}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-neutral-500">
                        {conversation.last_message_preview ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {status.emoji} {status.label}
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {conversation.assignee
                          ? supportDisplayName(conversation.assignee)
                          : "Unassigned"}
                      </td>
                      <td className="px-4 py-3 text-neutral-500" suppressHydrationWarning>
                        {conversation.updated_at
                          ? formatSupportTimestamp(conversation.updated_at)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {conversations.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-neutral-500">No conversations match.</p>
            ) : null}
          </div>

          <div className="flex min-h-[640px] flex-col border-b border-white/[0.06] bg-black/20 lg:border-b-0 lg:border-r">
            {activeConversation ? (
              <>
                <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                  <select
                    value={activeConversation.status}
                    onChange={(e) =>
                      run(() =>
                        updateSupportStatusAction(
                          activeConversation.id,
                          e.target.value as typeof activeConversation.status,
                        ),
                      )
                    }
                    className="rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-2 py-1.5 text-xs text-neutral-300"
                  >
                    <option value="open">🟢 Open</option>
                    <option value="waiting_on_staff">🟢 Waiting on Staff</option>
                    <option value="waiting_on_user">🟡 Waiting on Customer</option>
                    <option value="in_progress">🔵 In Progress</option>
                    <option value="ai_assisting">🟣 AI Assisting</option>
                    <option value="closed">🔴 Closed</option>
                    <option value="archived">⚫ Archived</option>
                  </select>
                  <select
                    value={activeConversation.assigned_to ?? ""}
                    onChange={(e) =>
                      run(() =>
                        assignSupportConversationAction(
                          activeConversation.id,
                          e.target.value || staffUserId,
                        ),
                      )
                    }
                    className="rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-2 py-1.5 text-xs text-neutral-300"
                  >
                    <option value="">Assign…</option>
                    {staffProfiles.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {supportDisplayName(staff)}
                      </option>
                    ))}
                  </select>
                  {activeConversation.ai_escalated ? (
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-200">
                      AI Escalated
                    </span>
                  ) : null}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      run(() =>
                        toggleSupportPriorityAction(
                          activeConversation.id,
                          !activeConversation.is_priority,
                        ),
                      )
                    }
                    className="rounded-lg border border-white/[0.08] px-2 py-1.5 text-xs text-neutral-300"
                  >
                    {activeConversation.is_priority ? "Remove priority" : "Mark priority"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      run(() =>
                        toggleSupportPinAction(activeConversation.id, !activeConversation.is_pinned),
                      )
                    }
                    className="rounded-lg border border-white/[0.08] px-2 py-1.5 text-xs text-neutral-300"
                  >
                    {activeConversation.is_pinned ? "Unpin" : "Pin"}
                  </button>
                </div>

                {aiMessages.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border-b border-violet-500/20 bg-violet-500/[0.04] px-4 py-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-300/80">
                      cried AI conversation
                    </p>
                    <div className="space-y-2">
                      {aiMessages.map((msg) => (
                        <div key={msg.id} className="text-xs leading-relaxed text-neutral-300">
                          <span className="font-medium text-violet-200/90">
                            {msg.role === "user" ? "Customer" : msg.role === "assistant" ? "cried AI" : "System"}:
                          </span>{" "}
                          {msg.body.slice(0, 280)}
                          {msg.body.length > 280 ? "…" : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="min-h-0 flex-1">
                  <SupportChatThread
                    conversation={activeConversation}
                    messages={messages}
                    viewerId={staffUserId}
                    isStaff
                    typingLabel={typingLabel}
                    quickReplies
                    onRefresh={refreshActiveConversation}
                    onDeleted={handleTicketDeleted}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-neutral-500">
                Select a conversation to open the support inbox thread.
              </div>
            )}
          </div>

          <aside className="hidden min-h-[640px] flex-col border-white/[0.06] bg-black/30 p-4 lg:flex">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-400/80">
              Staff notes
            </p>
            {activeConversation ? (
              <>
                <div className="mb-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
                  {notes.length === 0 ? (
                    <p className="text-xs text-neutral-500">No internal notes yet.</p>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-100/90"
                      >
                        <p>{note.body}</p>
                        <p className="mt-1 text-[10px] text-amber-200/50">
                          {supportDisplayName(note.author)} · {formatSupportTimestamp(note.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Private note — customer cannot see this…"
                    rows={3}
                    className="rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-3 py-2 text-sm text-white"
                  />
                  <button
                    type="button"
                    disabled={isPending || !noteDraft.trim()}
                    onClick={() =>
                      run(async () => {
                        const result = await addSupportInternalNoteAction(
                          activeConversation.id,
                          noteDraft,
                        );
                        if (!result.error) setNoteDraft("");
                        return result;
                      })
                    }
                    className="rounded-lg bg-amber-600/80 px-3 py-2 text-xs font-medium text-white"
                  >
                    Add note
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-neutral-500">Select a ticket to view and add staff notes.</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
