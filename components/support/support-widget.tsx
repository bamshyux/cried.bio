"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  createSupportConversationAction,
  fetchSupportConversationAction,
  fetchUserSupportInboxAction,
} from "@/app/actions/support";
import { SupportChatThread } from "@/components/support/support-chat-thread";
import { useSupportRealtime } from "@/hooks/use-support-realtime";
import { supportUnreadTotal } from "@/lib/support/format";
import type { SupportConversation, SupportMessage } from "@/lib/types/support";

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
      className={`bf-site-dock__button bf-site-dock__button--support${open ? " bf-site-dock__button--active" : ""}`}
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
  onUnreadChange,
}: {
  userId: string | null;
  onUnreadChange: (count: number) => void;
}) {
  const refreshUnread = useCallback(async () => {
    if (!userId) return;
    const result = await fetchUserSupportInboxAction();
    if ("error" in result) return;
    onUnreadChange(supportUnreadTotal(result.conversations));
  }, [onUnreadChange, userId]);

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
  const [error, setError] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [isPending, startTransition] = useTransition();

  const unreadTotal = supportUnreadTotal(conversations);

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
    setConversations(result.conversations);
  }, [search, userId]);

  const loadConversation = useCallback(async (conversationId: string) => {
    const result = await fetchSupportConversationAction({ conversationId });
    if ("error" in result) {
      setError(result.error);
      return;
    }
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
    onConversationChange: () => void loadInbox(),
    onMessageInsert: (conversationId) => {
      if (activeConversation?.id === conversationId) void loadConversation(conversationId);
      else void loadInbox();
    },
    onTyping: ({ isTyping }) => setOtherTyping(isTyping),
  });

  function startNewConversation() {
    startTransition(async () => {
      setError(null);
      const result = await createSupportConversationAction(subject, initialMessage);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSubject("");
      setInitialMessage("");
      await loadInbox();
      if (result.conversationId) await loadConversation(result.conversationId);
    });
  }

  function resetToHome() {
    setView("home");
    setActiveConversation(null);
    setMessages([]);
    setError(null);
  }

  return (
    <div className="bf-support-panel" role="dialog" aria-label="Customer support">
      <div className="bf-support-panel__header">
        <div>
          <p className="bf-support-panel__title">Customer Support</p>
          <p className="bf-support-panel__subtitle">We typically reply within a few hours.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onOpenChange(false);
            resetToHome();
          }}
          className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Close support"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!userId ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <p className="text-sm text-neutral-400">Sign in to start a private support conversation.</p>
          <Link
            href="/login"
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            Sign in
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
            isOtherTyping={otherTyping}
            onRefresh={() => {
              void loadConversation(activeConversation.id);
              void loadInbox();
            }}
          />
        </div>
      ) : view === "new" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4">
          <button type="button" onClick={resetToHome} className="self-start text-xs text-neutral-500 hover:text-white">
            ← Back
          </button>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="rounded-xl border border-white/[0.08] bg-[#0d0d0d] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/40"
          />
          <textarea
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            rows={5}
            placeholder="How can we help?"
            className="rounded-xl border border-white/[0.08] bg-[#0d0d0d] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/40"
          />
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <button
            type="button"
            disabled={isPending}
            onClick={startNewConversation}
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
          >
            Start conversation
          </button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-3 px-4 py-4">
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.08] px-4 py-3">
              <p className="text-sm font-medium text-white">Welcome to cried.bio Support</p>
              <p className="mt-1 text-xs leading-relaxed text-violet-100/80">
                Private tickets for your account only. Search past conversations or start a new one.
              </p>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full rounded-xl border border-white/[0.08] bg-[#0d0d0d] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/40"
            />
            <button
              type="button"
              onClick={() => setView("new")}
              className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              Start new conversation
            </button>
          </div>

          <div className="bf-support-chat-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            {conversations.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-neutral-500">No conversations yet.</p>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => loadConversation(conversation.id)}
                  className="mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">{conversation.subject}</p>
                      {(conversation.unread_count ?? 0) > 0 ? (
                        <span className="rounded-full bg-violet-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {conversation.unread_count}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-neutral-500">
                      {conversation.last_message_preview ?? "No messages yet"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
