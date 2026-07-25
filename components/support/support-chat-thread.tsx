"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  closeSupportConversationAction,
  deleteSupportConversationAction,
  markSupportMessagesReadAction,
  reopenSupportConversationAction,
  sendSupportMessageAction,
  uploadSupportAttachmentAction,
} from "@/app/actions/support";
import { SupportAvatar } from "@/components/support/support-avatar";
import { broadcastSupportTyping } from "@/hooks/use-support-realtime";
import {
  createSupportMessageSoundTracker,
  playSoundsForNewIncomingMessages,
  resetSupportMessageSoundTracker,
} from "@/lib/support/message-sounds";
import {
  formatSupportDateSeparator,
  formatSupportTimestamp,
  isSameSupportDay,
  isSupportMessageMine,
  supportDisplayName,
} from "@/lib/support/format";
import type { SupportConversation, SupportMessage } from "@/lib/types/support";
import {
  getSupportStatusDisplay,
  SUPPORT_QUICK_REPLIES,
} from "@/lib/types/support";

const COMMON_EMOJIS = ["👍", "❤️", "😊", "🙏", "✨", "🔥", "😅", "💯"];

export function SupportChatThread({
  conversation,
  messages,
  viewerId,
  isStaff,
  onBack,
  onRefresh,
  onDeleted,
  typingLabel = null,
  quickReplies = false,
}: {
  conversation: SupportConversation;
  messages: SupportMessage[];
  viewerId: string;
  isStaff: boolean;
  onBack?: () => void;
  onRefresh: () => void | Promise<void>;
  onDeleted?: () => void;
  typingLabel?: string | null;
  quickReplies?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingActiveRef = useRef(false);
  const messageSoundTrackerRef = useRef(createSupportMessageSoundTracker());

  useEffect(() => {
    resetSupportMessageSoundTracker(messageSoundTrackerRef.current);
  }, [conversation.id]);

  useEffect(() => {
    playSoundsForNewIncomingMessages(messages, isStaff, messageSoundTrackerRef.current);
  }, [messages, isStaff]);

  useEffect(() => {
    void markSupportMessagesReadAction(conversation.id, isStaff);
  }, [conversation.id, isStaff, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, typingLabel]);

  // Poll while thread is open so messages appear even if Realtime is delayed.
  useEffect(() => {
    const interval = window.setInterval(() => {
      void onRefresh();
    }, 4000);
    return () => window.clearInterval(interval);
  }, [conversation.id, onRefresh]);

  const groupedMessages = useMemo(() => messages, [messages]);

  const viewerLabel = useMemo(() => {
    const ownMessage = messages.find((message) => isSupportMessageMine(message, isStaff));
    if (ownMessage?.author) return supportDisplayName(ownMessage.author);
    if (isStaff) return "Staff";
    if (conversation.customer) return supportDisplayName(conversation.customer);
    return "User";
  }, [conversation.customer, isStaff, messages]);

  useEffect(() => {
    typingActiveRef.current = false;
    return () => {
      if (typingActiveRef.current) {
        broadcastSupportTyping({
          conversationId: conversation.id,
          userId: viewerId,
          isStaff,
          displayName: viewerLabel,
          isTyping: false,
        });
      }
    };
  }, [conversation.id, isStaff, viewerId, viewerLabel]);

  const isClosed = conversation.status === "closed" || conversation.status === "archived";
  const statusDisplay = getSupportStatusDisplay(conversation.status);
  const waitingForStaff =
    !isStaff &&
    (conversation.status === "waiting_on_staff" || conversation.status === "in_progress");

  function notifyTyping(isTyping: boolean) {
    if (isTyping === typingActiveRef.current) return;
    typingActiveRef.current = isTyping;
    broadcastSupportTyping({
      conversationId: conversation.id,
      userId: viewerId,
      isStaff,
      displayName: viewerLabel,
      isTyping,
    });
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    notifyTyping(value.length > 0);
  }

  function sendMessage(body: string) {
    const trimmed = body.trim();
    if (!trimmed && !file) return;

    startTransition(async () => {
      setError(null);
      const result = await sendSupportMessageAction({
        conversationId: conversation.id,
        body: trimmed || "(attachment)",
        asStaff: isStaff,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (file && result.messageId) {
        const formData = new FormData();
        formData.set("file", file);
        const upload = await uploadSupportAttachmentAction(
          conversation.id,
          result.messageId,
          formData,
          isStaff,
        );
        if (upload.error) setError(upload.error);
      }

      setDraft("");
      setFile(null);
      notifyTyping(false);
      await onRefresh();
    });
  }

  function toggleClosed(nextClosed: boolean) {
    startTransition(async () => {
      setError(null);
      const result = nextClosed
        ? await closeSupportConversationAction(conversation.id, isStaff)
        : await reopenSupportConversationAction(conversation.id, isStaff);
      if (result.error) setError(result.error);
      else await onRefresh();
    });
  }

  function deleteTicket() {
    if (
      !window.confirm(
        "Delete this closed ticket? A transcript will be kept for 72 hours in staff archives, then permanently removed.",
      )
    ) {
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await deleteSupportConversationAction(conversation.id, isStaff);
      if (result.error) setError(result.error);
      else onDeleted?.();
    });
  }

  return (
    <div className="bf-support-thread">
      <div className="bf-support-thread__toolbar">
        {onBack ? (
          <button type="button" onClick={onBack} className="bf-support-thread__back" aria-label="Back to conversations">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18 9 12l6-6" />
            </svg>
          </button>
        ) : null}
        <div className="bf-support-thread__info">
          <p className="bf-support-thread__subject">{conversation.subject}</p>
          <span className="bf-support-status-pill mt-1">
            {statusDisplay.emoji} {statusDisplay.label}
            {conversation.ai_escalated ? " · AI Escalated" : ""}
          </span>
        </div>
        <div className="bf-support-thread__actions">
          {isClosed ? (
            <button
              type="button"
              disabled={isPending}
              onClick={deleteTicket}
              className="bf-support-thread__delete-btn"
            >
              Delete
            </button>
          ) : null}
          <button
            type="button"
            disabled={isPending}
            onClick={() => toggleClosed(!isClosed)}
            className="bf-support-thread__close-btn"
          >
            {isClosed ? "Re-open" : "Close"}
          </button>
        </div>
      </div>

      {!isStaff && waitingForStaff ? (
        <div className="border-b border-violet-500/20 bg-violet-500/[0.06] px-4 py-3 text-xs leading-relaxed text-violet-100/90">
          <p className="font-medium text-violet-100">Waiting for staff…</p>
          <p className="mt-1 text-violet-200/70">
            {conversation.assignee
              ? `Assigned to ${supportDisplayName(conversation.assignee)}`
              : "A team member will be assigned shortly"}
            {" · "}Typical response within a few hours
          </p>
        </div>
      ) : null}

      <div ref={scrollRef} className="bf-support-chat-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {groupedMessages.map((message, index) => {
          const previous = groupedMessages[index - 1];
          const showDate =
            !previous || !isSameSupportDay(previous.created_at, message.created_at);
          const isMine = isSupportMessageMine(message, isStaff);

          return (
            <div key={message.id}>
              {showDate ? (
                <div className="my-4 flex justify-center">
                  <span className="bf-support-date-chip">
                    {formatSupportDateSeparator(message.created_at)}
                  </span>
                </div>
              ) : null}
              <div className={`bf-support-msg${isMine ? " bf-support-msg--mine" : ""}`}>
                <SupportAvatar profile={message.author} size={28} staff={message.is_staff} />
                <div className="bf-support-msg__body">
                  <div className="bf-support-msg__meta">
                    <span>{supportDisplayName(message.author)}</span>
                    {message.is_staff ? <span className="bf-support-staff-badge">Staff</span> : null}
                  </div>
                  <div className={`bf-support-bubble${isMine ? " bf-support-bubble--mine" : " bf-support-bubble--theirs"}`}>
                    {message.body !== "(attachment)" ? (
                      <p className="bf-support-bubble__text">{message.body}</p>
                    ) : null}
                    {message.attachments?.map((attachment) =>
                      attachment.mime_type.startsWith("image/") ? (
                        <a
                          key={attachment.id}
                          href={`/api/support/attachment/${attachment.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bf-support-attachment"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/support/attachment/${attachment.id}`}
                            alt={attachment.file_name}
                            loading="lazy"
                            decoding="async"
                          />
                        </a>
                      ) : (
                        <a
                          key={attachment.id}
                          href={`/api/support/attachment/${attachment.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bf-support-attachment bf-support-attachment--file"
                        >
                          {attachment.file_name}
                        </a>
                      ),
                    )}
                  </div>
                  <div className="bf-support-msg__time">
                    <span>{formatSupportTimestamp(message.created_at)}</span>
                    {isMine && message.read_at ? <span>Read</span> : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {typingLabel ? (
          <div className="bf-support-typing-line">
            <span className="bf-support-typing">
              <span />
              <span />
              <span />
            </span>
            <span>{typingLabel} is typing…</span>
          </div>
        ) : null}
      </div>

      {error ? <p className="px-4 pb-2 text-xs text-red-400">{error}</p> : null}

      {quickReplies ? (
        <div className="flex flex-wrap gap-2 border-t border-white/[0.06] px-4 py-2">
          {SUPPORT_QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => sendMessage(reply)}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] text-neutral-400 transition-colors hover:text-white"
            >
              {reply.slice(0, 42)}…
            </button>
          ))}
        </div>
      ) : null}

      <div className="bf-support-composer">
        {isClosed ? (
          <p className="bf-support-composer__closed">
            This ticket is closed. Re-open it to send another message.
          </p>
        ) : (
          <>
            {file ? (
              <div className="bf-support-composer__file">
                <span className="truncate">{file.name}</span>
                <button type="button" onClick={() => setFile(null)} className="text-neutral-500 hover:text-white">
                  Remove
                </button>
              </div>
            ) : null}
            <div className="relative">
              {showEmoji ? (
                <div className="bf-support-composer__emoji">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setDraft((prev) => `${prev}${emoji}`);
                        setShowEmoji(false);
                      }}
                      className="bf-support-composer__emoji-btn"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="bf-support-composer__row">
                <textarea
                  value={draft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(draft);
                    }
                  }}
                  rows={1}
                  placeholder="Type a message…"
                  className="bf-support-composer__input"
                />
                <div className="bf-support-composer__actions">
                  <button
                    type="button"
                    onClick={() => setShowEmoji((prev) => !prev)}
                    className="bf-support-composer__btn"
                    aria-label="Insert emoji"
                  >
                    <span className="text-base leading-none">🙂</span>
                  </button>
                  <label className="bf-support-composer__btn cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.txt"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.88 16.88a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                    </svg>
                  </label>
                  <button
                    type="button"
                    disabled={isPending || (!draft.trim() && !file)}
                    onClick={() => sendMessage(draft)}
                    className="bf-support-composer__send"
                    aria-label="Send message"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
