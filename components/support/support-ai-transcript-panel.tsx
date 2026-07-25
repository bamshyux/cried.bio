"use client";

import { formatSupportTimestamp } from "@/lib/support/format";
import type { SupportAiMessage } from "@/lib/types/support";

function AiAvatarSmall() {
  return (
    <div className="bf-support-ai-avatar bf-support-ai-avatar--sm" aria-hidden>
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v1h1a2 2 0 0 1 0 4h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a2 2 0 0 1 0-4h1v-1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2Z" />
      </svg>
    </div>
  );
}

export function SupportAiTranscriptPanel({
  messages,
  compact = false,
}: {
  messages: SupportAiMessage[];
  compact?: boolean;
}) {
  const visible = messages.filter((m) => m.role !== "system");
  if (visible.length === 0) return null;

  return (
    <div className={`bf-support-ai-transcript${compact ? " bf-support-ai-transcript--compact" : ""}`}>
      <div className="bf-support-ai-transcript__header">
        <AiAvatarSmall />
        <div>
          <p className="bf-support-ai-transcript__title">cried AI conversation</p>
          <p className="bf-support-ai-transcript__subtitle">Attached for staff review</p>
        </div>
      </div>
      <div className="bf-support-ai-transcript__log">
        {visible.map((msg) => (
          <div
            key={msg.id}
            className={`bf-support-ai-transcript__entry bf-support-ai-transcript__entry--${msg.role}`}
          >
            <div className="bf-support-ai-transcript__entry-head">
              <span className="bf-support-ai-transcript__role">
                {msg.role === "user" ? "Customer" : "cried AI"}
              </span>
              <span className="bf-support-ai-transcript__time">
                {formatSupportTimestamp(msg.created_at)}
              </span>
            </div>
            <p className="bf-support-ai-transcript__body">{msg.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function isLegacyAiTranscriptMessage(body: string): boolean {
  return body.includes("AI Conversation Transcript") || body.includes("📋 **AI Conversation");
}
