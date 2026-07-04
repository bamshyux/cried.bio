"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  closeSupportConversationAction,
  markSupportMessagesReadAction,
  reopenSupportConversationAction,
  sendSupportMessageAction,
  uploadSupportAttachmentAction,
} from "@/app/actions/support";
import { SupportAvatar } from "@/components/support/support-avatar";
import { broadcastSupportTyping } from "@/hooks/use-support-realtime";
import {
  formatSupportDateSeparator,
  formatSupportTimestamp,
  isSameSupportDay,
  supportDisplayName,
} from "@/lib/support/format";
import type { SupportConversation, SupportMessage } from "@/lib/types/support";
import {
  SUPPORT_QUICK_REPLIES,
  SUPPORT_STATUS_EMOJI,
  SUPPORT_STATUS_LABELS,
} from "@/lib/types/support";

const COMMON_EMOJIS = ["👍", "❤️", "😊", "🙏", "✨", "🔥", "😅", "💯"];

export function SupportChatThread({
  conversation,
  messages,
  viewerId,
  isStaff,
  onBack,
  onRefresh,
  quickReplies = false,
  isOtherTyping = false,
}: {
  conversation: SupportConversation;
  messages: SupportMessage[];
  viewerId: string;
  isStaff: boolean;
  onBack?: () => void;
  onRefresh: () => void;
  quickReplies?: boolean;
  isOtherTyping?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    void markSupportMessagesReadAction(conversation.id, isStaff);
  }, [conversation.id, isStaff, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isOtherTyping]);

  const statusLabel = `${SUPPORT_STATUS_EMOJI[conversation.status]} ${SUPPORT_STATUS_LABELS[conversation.status]}`;
  const isClosed = conversation.status === "closed";

  const groupedMessages = useMemo(() => messages, [messages]);

  function notifyTyping(isTyping: boolean) {
    broadcastSupportTyping(conversation.id, viewerId, isTyping);
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    notifyTyping(true);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => notifyTyping(false), 1200);
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
      onRefresh();
    });
  }

  function toggleClosed(nextClosed: boolean) {
    startTransition(async () => {
      setError(null);
      const result = nextClosed
        ? await closeSupportConversationAction(conversation.id, isStaff)
        : await reopenSupportConversationAction(conversation.id, isStaff);
      if (result.error) setError(result.error);
      else onRefresh();
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-start gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mt-0.5 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Back to conversations"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18 9 12l6-6" />
              </svg>
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{conversation.subject}</p>
            <p className="mt-0.5 text-xs text-neutral-500">{statusLabel}</p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => toggleClosed(!isClosed)}
            className="shrink-0 rounded-lg border border-white/[0.08] px-2.5 py-1 text-[11px] text-neutral-300 transition-colors hover:border-white/[0.16] hover:text-white"
          >
            {isClosed ? "Re-open" : "Close"}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="bf-support-chat-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {groupedMessages.map((message, index) => {
          const previous = groupedMessages[index - 1];
          const showDate =
            !previous || !isSameSupportDay(previous.created_at, message.created_at);
          const isMine = message.author_id === viewerId;

          return (
            <div key={message.id}>
              {showDate ? (
                <div className="my-4 flex justify-center">
                  <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                    {formatSupportDateSeparator(message.created_at)}
                  </span>
                </div>
              ) : null}
              <div className={`flex gap-2.5 ${isMine ? "flex-row-reverse" : ""}`}>
                <SupportAvatar
                  profile={message.author}
                  size={28}
                  staff={message.is_staff}
                />
                <div className={`max-w-[78%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                  <div className="mb-1 flex items-center gap-2 text-[10px] text-neutral-500">
                    <span>{supportDisplayName(message.author)}</span>
                    {message.is_staff ? (
                      <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-200">
                        Staff
                      </span>
                    ) : null}
                  </div>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-lg ${
                      isMine
                        ? "rounded-br-md bg-violet-600/90 text-white"
                        : "rounded-bl-md border border-white/[0.08] bg-white/[0.06] text-neutral-100"
                    }`}
                  >
                    {message.body !== "(attachment)" ? (
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    ) : null}
                    {message.attachments?.map((attachment) =>
                      attachment.mime_type.startsWith("image/") && attachment.url ? (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block overflow-hidden rounded-xl border border-white/10"
                        >
                          <Image
                            src={attachment.url}
                            alt={attachment.file_name}
                            width={280}
                            height={180}
                            className="max-h-48 w-auto object-cover"
                          />
                        </a>
                      ) : (
                        <a
                          key={attachment.id}
                          href={attachment.url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-violet-200"
                        >
                          {attachment.file_name}
                        </a>
                      ),
                    )}
                  </div>
                  <div className={`mt-1 flex items-center gap-2 text-[10px] text-neutral-600 ${isMine ? "flex-row-reverse" : ""}`}>
                    <span>{formatSupportTimestamp(message.created_at)}</span>
                    {isMine && message.read_at ? <span>Read</span> : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isOtherTyping ? (
          <div className="flex items-center gap-2 px-1 text-xs text-neutral-500">
            <span className="bf-support-typing">
              <span />
              <span />
              <span />
            </span>
            Someone is typing…
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

      <div className="border-t border-white/[0.08] p-3">
        {isClosed ? (
          <p className="text-center text-xs text-neutral-500">
            This conversation is closed. Re-open it to send another message.
          </p>
        ) : (
          <>
            {file ? (
              <div className="mb-2 flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-neutral-300">
                <span className="truncate">{file.name}</span>
                <button type="button" onClick={() => setFile(null)} className="text-neutral-500 hover:text-white">
                  Remove
                </button>
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <div className="relative min-w-0 flex-1">
                <textarea
                  value={draft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(draft);
                    }
                  }}
                  rows={2}
                  placeholder="Type a message…"
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#0d0d0d] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-neutral-600 focus:border-violet-500/40"
                />
                {showEmoji ? (
                  <div className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-xl border border-white/[0.08] bg-[#121212] p-2 shadow-xl">
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setDraft((prev) => `${prev}${emoji}`);
                          setShowEmoji(false);
                        }}
                        className="rounded p-1 text-lg hover:bg-white/[0.06]"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowEmoji((prev) => !prev)}
                  className="rounded-lg border border-white/[0.08] p-2 text-neutral-400 hover:text-white"
                  aria-label="Insert emoji"
                >
                  🙂
                </button>
                <label className="cursor-pointer rounded-lg border border-white/[0.08] p-2 text-neutral-400 hover:text-white">
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
                  className="rounded-lg bg-violet-600 p-2 text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
                  aria-label="Send message"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
