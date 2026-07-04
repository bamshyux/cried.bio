"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  createSupportConversationAction,
  fetchSupportConversationAction,
  fetchUserSupportInboxAction,
  uploadSupportAttachmentAction,
} from "@/app/actions/support";
import { SupportChatThread } from "@/components/support/support-chat-thread";
import { useSupportRealtime, useSupportTypingIndicator } from "@/hooks/use-support-realtime";
import { formatSupportTimestamp, supportUnreadTotal } from "@/lib/support/format";
import {
  pickLatestUnreadConversation,
  playSupportMessageSound,
  type SupportReplyAlert,
} from "@/lib/support/notifications";
import type { SupportConversation, SupportMessage } from "@/lib/types/support";
import {
  SUPPORT_STATUS_EMOJI,
  SUPPORT_STATUS_LABELS,
} from "@/lib/types/support";

const SUPPORT_TOPICS = [
  { icon: "🐛", label: "Report a bug" },
  { icon: "💳", label: "Billing & premium" },
  { icon: "🔐", label: "Account access" },
  { icon: "✨", label: "Profile help" },
];

function SupportPanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="bf-support-panel__header">
      <div className="bf-support-panel__brand">
        <div className="bf-support-panel__brand-icon" aria-hidden>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
          </svg>
        </div>
        <div>
          <p className="bf-support-panel__title">Support</p>
          <p className="bf-support-panel__subtitle">Real people · Usually replies within a few hours</p>
        </div>
      </div>
      <button type="button" onClick={onClose} className="bf-support-panel__close" aria-label="Close support">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function SupportWidgetTrigger({
  userId,
  unreadTotal,
  open,
  onToggle,
}: {
  userId: string | null;
  unreadTotal: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Open customer support"
      aria-expanded={open}
      className={`bf-site-dock__button bf-site-dock__button--support${open ? " bf-site-dock__button--active" : ""}${!open && userId && unreadTotal > 0 ? " bf-site-dock__button--unread" : ""}`}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      </svg>
      {userId && unreadTotal > 0 ? (
        <span className="bf-site-dock__badge">{unreadTotal > 9 ? "9+" : unreadTotal}</span>
      ) : null}
    </button>
  );
}

export function SupportWidgetUnreadPoller({
  userId,
  widgetOpen,
  onUnreadChange,
  onStaffReply,
}: {
  userId: string | null;
  widgetOpen: boolean;
  onUnreadChange: (count: number) => void;
  onStaffReply?: (alert: SupportReplyAlert) => void;
}) {
  const prevUnreadRef = useRef(0);
  const initializedRef = useRef(false);

  const refreshUnread = useCallback(async () => {
    if (!userId) return;
    const result = await fetchUserSupportInboxAction();
    if ("error" in result) return;

    const unread = supportUnreadTotal(result.conversations);

    if (initializedRef.current && unread > prevUnreadRef.current) {
      playSupportMessageSound();
      if (!widgetOpen) {
        const alert = pickLatestUnreadConversation(result.conversations);
        if (alert) onStaffReply?.(alert);
      }
    }

    initializedRef.current = true;
    prevUnreadRef.current = unread;
    onUnreadChange(unread);
  }, [onStaffReply, onUnreadChange, userId, widgetOpen]);

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread]);

  useSupportRealtime({
    userId,
    conversationId: null,
    isStaff: false,
    enabled: Boolean(userId),
    onConversationChange: () => void refreshUnread(),
    onMessageInsert: () => void refreshUnread(),
  });

  return null;
}

export function SupportWidgetBody({
  userId,
  onOpenChange,
  onUnreadChange,
}: {
  userId: string | null;
  onOpenChange: (open: boolean) => void;
  onUnreadChange: (count: number) => void;
}) {
  const [view, setView] = useState<"home" | "new" | "chat">("home");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [subject, setSubject] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [newTicketFile, setNewTicketFile] = useState<File | null>(null);
  const [newTicketPreview, setNewTicketPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { typingLabel, handleTyping, clearTyping } = useSupportTypingIndicator();
  const [isPending, startTransition] = useTransition();
  const activeConversationIdRef = useRef<string | null>(null);
  const messageSnapshotRef = useRef<{ conversationId: string; staffCount: number } | null>(null);
  const prevUnreadRef = useRef(0);
  const initializedUnreadRef = useRef(false);

  activeConversationIdRef.current = activeConversation?.id ?? null;

  useEffect(() => {
    clearTyping();
  }, [activeConversation?.id, clearTyping]);

  useEffect(() => {
    if (!newTicketFile) {
      setNewTicketPreview(null);
      return;
    }
    if (!newTicketFile.type.startsWith("image/")) {
      setNewTicketPreview(null);
      return;
    }
    const url = URL.createObjectURL(newTicketFile);
    setNewTicketPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [newTicketFile]);

  const unreadTotal = supportUnreadTotal(conversations);
  const openTicketCount = conversations.filter((c) => c.status !== "closed").length;

  useEffect(() => {
    onUnreadChange(unreadTotal);
  }, [onUnreadChange, unreadTotal]);

  const loadInbox = useCallback(async () => {
    if (!userId) return;
    const result = await fetchUserSupportInboxAction(search);
    if ("error" in result) {
      setError(result.error);
      return;
    }

    const unread = supportUnreadTotal(result.conversations);
    if (initializedUnreadRef.current && unread > prevUnreadRef.current) {
      playSupportMessageSound();
    }
    initializedUnreadRef.current = true;
    prevUnreadRef.current = unread;

    setConversations(result.conversations);
  }, [search, userId]);

  const loadConversation = useCallback(async (conversationId: string) => {
    const result = await fetchSupportConversationAction({ conversationId });
    if ("error" in result) {
      setError(result.error);
      return;
    }

    const staffCount = result.messages.filter((message) => message.is_staff).length;
    const snap = messageSnapshotRef.current;
    if (snap?.conversationId === conversationId && staffCount > snap.staffCount) {
      playSupportMessageSound();
    }
    messageSnapshotRef.current = { conversationId, staffCount };

    setActiveConversation(result.conversation);
    setMessages(result.messages);
    setView("chat");
  }, []);

  useEffect(() => {
    if (!userId) return;
    void loadInbox();
  }, [userId, loadInbox]);

  useSupportRealtime({
    userId,
    conversationId: activeConversation?.id ?? null,
    isStaff: false,
    enabled: Boolean(userId),
    onConversationChange: () => {
      void loadInbox();
      const openId = activeConversationIdRef.current;
      if (openId) void loadConversation(openId);
    },
    onMessageInsert: (conversationId) => {
      if (activeConversationIdRef.current === conversationId) void loadConversation(conversationId);
      else void loadInbox();
    },
    onTyping: handleTyping,
  });

  const refreshActiveConversation = useCallback(async () => {
    const openId = activeConversationIdRef.current;
    if (openId) await loadConversation(openId);
  }, [loadConversation]);

  function startNewConversation() {
    const trimmedSubject = subject.trim();
    const trimmedMessage = initialMessage.trim();
    if (!trimmedSubject) {
      setError("Subject is required.");
      return;
    }
    if (!trimmedMessage && !newTicketFile) {
      setError("Add a message or attach an image.");
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await createSupportConversationAction(
        trimmedSubject,
        trimmedMessage || "(attachment)",
      );
      if (result.error) {
        setError(result.error);
        return;
      }

      if (newTicketFile && result.conversationId && result.messageId) {
        const formData = new FormData();
        formData.set("file", newTicketFile);
        const upload = await uploadSupportAttachmentAction(
          result.conversationId,
          result.messageId,
          formData,
          false,
        );
        if (upload.error) {
          setError(upload.error);
          return;
        }
      }

      setSubject("");
      setInitialMessage("");
      setNewTicketFile(null);
      await loadInbox();
      if (result.conversationId) await loadConversation(result.conversationId);
    });
  }

  function clearNewTicketFile() {
    setNewTicketFile(null);
  }

  function resetToHome() {
    setView("home");
    setActiveConversation(null);
    setMessages([]);
    setNewTicketFile(null);
    messageSnapshotRef.current = null;
    setError(null);
  }

  function handleClose() {
    onOpenChange(false);
    resetToHome();
  }

  return (
    <div className="bf-support-panel" role="dialog" aria-label="Customer support">
      <SupportPanelHeader onClose={handleClose} />

      {!userId ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <div className="bf-support-panel__brand-icon" aria-hidden>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
            </svg>
          </div>
          <p className="text-sm text-neutral-300">Sign in to message our team directly.</p>
          <p className="max-w-[220px] text-xs leading-relaxed text-neutral-500">
            Account help, billing questions, bug reports — all handled in private tickets.
          </p>
          <Link href="/login" className="bf-support-cta mt-1 w-auto px-6">
            Sign in to get help
          </Link>
        </div>
      ) : view === "chat" && activeConversation ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <SupportChatThread
            conversation={activeConversation}
            messages={messages}
            viewerId={userId}
            isStaff={false}
            onBack={resetToHome}
            typingLabel={typingLabel}
            onRefresh={refreshActiveConversation}
            onDeleted={() => {
              resetToHome();
              void loadInbox();
            }}
          />
        </div>
      ) : view === "new" ? (
        <div className="bf-support-form">
          <button type="button" onClick={resetToHome} className="bf-support-form__back">
            ← Back to inbox
          </button>
          <div>
            <label htmlFor="support-subject" className="bf-support-field__label">
              What do you need help with?
            </label>
            <input
              id="support-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Profile not saving, billing question…"
              className="bf-support-field__input"
            />
          </div>
          <div className="min-h-0 flex-1">
            <label htmlFor="support-message" className="bf-support-field__label">
              Describe the issue
            </label>
            <textarea
              id="support-message"
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              rows={5}
              placeholder="Tell us what happened, what you expected, and any steps to reproduce."
              className="bf-support-field__textarea"
            />
          </div>
          <div>
            <p className="bf-support-field__label">Attach a screenshot (optional)</p>
            {newTicketFile ? (
              <div className="bf-support-form__attach-preview">
                <div className="flex min-w-0 items-center gap-3">
                  {newTicketPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={newTicketPreview} alt="" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] text-lg">
                      📎
                    </span>
                  )}
                  <span className="truncate">{newTicketFile.name}</span>
                </div>
                <button type="button" onClick={clearNewTicketFile} className="text-neutral-500 hover:text-white">
                  Remove
                </button>
              </div>
            ) : (
              <label className="bf-support-form__attach">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.txt"
                  onChange={(e) => setNewTicketFile(e.target.files?.[0] ?? null)}
                />
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.88 16.88a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                </svg>
                Add image or file
              </label>
            )}
          </div>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <button
            type="button"
            disabled={isPending || !subject.trim() || (!initialMessage.trim() && !newTicketFile)}
            onClick={startNewConversation}
            className="bf-support-cta"
          >
            <span className="bf-support-cta__icon" aria-hidden>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            Send to support
          </button>
        </div>
      ) : (
        <div className="bf-support-home">
          <div className="bf-support-hero">
            <p className="bf-support-hero__title">How can we help?</p>
            <p className="bf-support-hero__text">
              Message our team about bugs, billing, account access, or anything on your profile.
              {openTicketCount > 0
                ? ` You have ${openTicketCount} open ticket${openTicketCount === 1 ? "" : "s"}.`
                : " Start a ticket and we'll get back to you."}
            </p>
            <div className="bf-support-topics">
              {SUPPORT_TOPICS.map((topic) => (
                <button
                  key={topic.label}
                  type="button"
                  onClick={() => {
                    setSubject(topic.label);
                    setView("new");
                  }}
                  className="bf-support-topic"
                >
                  <span aria-hidden>{topic.icon}</span>
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bf-support-search">
            <svg className="bf-support-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your tickets…"
              className="bf-support-search__input"
            />
          </div>

          <button type="button" onClick={() => setView("new")} className="bf-support-cta">
            <span className="bf-support-cta__icon" aria-hidden>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            New conversation
          </button>

          <p className="bf-support-inbox-label">Your tickets</p>

          <div className="bf-support-chat-scroll min-h-0 flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="bf-support-empty">
                <p className="bf-support-empty__title">No tickets yet</p>
                <p className="bf-support-empty__text">
                  Hit &ldquo;New conversation&rdquo; above — we&apos;ll reply here when we&apos;ve got an answer.
                </p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const unread = (conversation.unread_count ?? 0) > 0;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => loadConversation(conversation.id)}
                    className={`bf-support-convo${unread ? " bf-support-convo--unread" : ""}`}
                  >
                    <div className="bf-support-convo__icon" aria-hidden>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="bf-support-convo__title">{conversation.subject}</p>
                      <p className="bf-support-convo__preview">
                        {conversation.last_message_preview ?? "No messages yet"}
                      </p>
                      <div className="bf-support-convo__meta">
                        <span className="bf-support-status-pill">
                          {SUPPORT_STATUS_EMOJI[conversation.status]}{" "}
                          {SUPPORT_STATUS_LABELS[conversation.status]}
                        </span>
                        {conversation.last_message_at ? (
                          <span>{formatSupportTimestamp(conversation.last_message_at)}</span>
                        ) : null}
                      </div>
                    </div>
                    {unread ? (
                      <span className="bf-support-unread-badge">{conversation.unread_count}</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
