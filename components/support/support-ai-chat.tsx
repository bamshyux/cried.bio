"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  escalateSupportAiToTicketAction,
  resolveSupportAiSessionAction,
  sendSupportAiMessageAction,
  startSupportAiSessionAction,
} from "@/app/actions/support-ai";
import { SUPPORT_AI_ESCALATION_PROMPT } from "@/lib/types/support";
import type { SupportAiMessage } from "@/lib/types/support";

function AiAvatar() {
  return (
    <div className="bf-support-ai-avatar" aria-hidden>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v1h1a2 2 0 0 1 0 4h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a2 2 0 0 1 0-4h1v-1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2Z" />
        <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}

function renderMarkdownLite(text: string) {
  return text.split("\n").map((line, i) => {
    const html = line
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-violet-300 underline">$1</a>');
    return (
      <span key={i}>
        {i > 0 ? <br /> : null}
        <span dangerouslySetInnerHTML={{ __html: html }} />
      </span>
    );
  });
}

export function SupportAiChat({
  topicLabel,
  onBack,
  onTicketCreated,
}: {
  topicLabel?: string | null;
  onBack: () => void;
  onTicketCreated: (conversationId: string) => void;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportAiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shouldEscalate, setShouldEscalate] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [booting, setBooting] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topicRef = useRef(topicLabel);

  useEffect(() => {
    topicRef.current = topicLabel;
    startTransition(async () => {
      const result = await startSupportAiSessionAction(topicRef.current ?? undefined);
      if (result.error) {
        setError(result.error);
        setBooting(false);
        return;
      }
      setSessionId(result.sessionId ?? null);
      if (result.greeting) {
        setMessages([
          {
            id: "greeting",
            session_id: result.sessionId ?? "",
            role: "assistant",
            body: result.greeting,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      setBooting(false);
    });
  }, [topicLabel]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, shouldEscalate]);

  function sendMessage() {
    const trimmed = draft.trim();
    if (!trimmed || !sessionId || resolved) return;

    startTransition(async () => {
      setError(null);
      setDraft("");

      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          session_id: sessionId,
          role: "user",
          body: trimmed,
          created_at: new Date().toISOString(),
        },
      ]);

      const result = await sendSupportAiMessageAction(sessionId, trimmed);
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.aiReply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            session_id: sessionId,
            role: "assistant",
            body: result.aiReply!,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      if (result.shouldEscalate) setShouldEscalate(true);
      if (result.success?.includes("Glad")) setResolved(true);
    });
  }

  function markResolved() {
    if (!sessionId) return;
    startTransition(async () => {
      await resolveSupportAiSessionAction(sessionId);
      setResolved(true);
      setShouldEscalate(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `resolved-${Date.now()}`,
          session_id: sessionId,
          role: "assistant",
          body: "Glad I could help! 🎉 Feel free to come back anytime.",
          created_at: new Date().toISOString(),
        },
      ]);
    });
  }

  function createTicket() {
    if (!sessionId) return;
    startTransition(async () => {
      setError(null);
      const result = await escalateSupportAiToTicketAction(sessionId, topicLabel ?? undefined);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.conversationId) onTicketCreated(result.conversationId);
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <button type="button" onClick={onBack} className="bf-support-form__back mb-2">
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <AiAvatar />
          <div>
            <p className="text-sm font-medium text-white">cried AI</p>
            <p className="text-xs text-violet-300/80">
              {topicLabel ? `${topicLabel} · ` : ""}Support assistant · Usually instant
            </p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="bf-support-chat-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {booting ? (
          <p className="text-center text-sm text-neutral-500">Starting cried AI…</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.role === "assistant" ? <AiAvatar /> : null}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-violet-600/30 text-violet-50"
                      : "bg-white/[0.06] text-neutral-200"
                  }`}
                >
                  {msg.role === "assistant" ? renderMarkdownLite(msg.body) : msg.body}
                </div>
              </div>
            ))}
            {isPending ? (
              <div className="flex gap-2">
                <AiAvatar />
                <div className="rounded-2xl bg-white/[0.06] px-3.5 py-2.5 text-sm text-neutral-500">
                  cried AI is typing…
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {error ? <p className="px-4 pb-2 text-xs text-red-400">{error}</p> : null}

      {shouldEscalate && !resolved ? (
        <div className="border-t border-violet-500/20 bg-violet-500/[0.08] px-4 py-3">
          <p className="mb-2 text-xs leading-relaxed text-violet-100/90">
            {SUPPORT_AI_ESCALATION_PROMPT}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={createTicket}
              className="bf-support-ai-composer__escalate flex-1"
            >
              Create ticket
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={markResolved}
              className="bf-support-ai-composer__secondary shrink-0"
            >
              I&apos;m all set
            </button>
          </div>
        </div>
      ) : resolved ? (
        <div className="border-t border-white/[0.06] px-4 py-3">
          <button type="button" onClick={onBack} className="bf-support-ai-composer__escalate w-full">
            Back to support home
          </button>
        </div>
      ) : (
        <div className="bf-support-ai-composer">
          <div className="bf-support-ai-composer__quick">
            <button type="button" onClick={markResolved} className="bf-support-ai-composer__chip">
              ✓ Issue solved
            </button>
            <button
              type="button"
              onClick={() => setShouldEscalate(true)}
              className="bf-support-ai-composer__chip"
            >
              Talk to staff
            </button>
          </div>
          <div className="bf-support-ai-composer__row">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask cried AI anything…"
              disabled={booting || resolved}
              className="bf-support-ai-composer__input"
            />
            <button
              type="button"
              disabled={isPending || !draft.trim() || booting || resolved}
              onClick={sendMessage}
              className="bf-support-ai-composer__send"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
