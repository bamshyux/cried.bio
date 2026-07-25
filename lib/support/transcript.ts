import type {
  SupportAiMessage,
  SupportConversation,
  SupportInternalNote,
  SupportMessage,
  SupportProfileSummary,
  SupportStatusHistoryEntry,
  SupportTranscriptPayload,
} from "@/lib/types/support";
import { supportDisplayName } from "@/lib/support/format";

export function buildSupportTranscriptPayload(input: {
  conversation: SupportConversation;
  messages: SupportMessage[];
  notes: SupportInternalNote[];
  aiMessages?: SupportAiMessage[];
}): SupportTranscriptPayload {
  const { conversation, messages, notes, aiMessages = [] } = input;

  return {
    subject: conversation.subject,
    category: conversation.category ?? null,
    ai_escalated: Boolean(conversation.ai_escalated),
    ai_messages: aiMessages,
    messages: messages.map((message) => ({
      id: message.id,
      author_id: message.author_id,
      author_name: supportDisplayName(message.author),
      is_staff: message.is_staff,
      body: message.body,
      created_at: message.created_at,
      attachments: message.attachments?.map((a) => ({
        id: a.id,
        file_name: a.file_name,
        mime_type: a.mime_type,
        size_bytes: a.size_bytes,
      })),
    })),
    internal_notes: notes.map((note) => ({
      id: note.id,
      author_name: supportDisplayName(note.author),
      body: note.body,
      created_at: note.created_at,
    })),
    status_history: conversation.status_history ?? [],
  };
}

export function transcriptToMarkdown(
  transcript: SupportTranscriptPayload,
  meta: {
    customer?: SupportProfileSummary | null;
    staff?: SupportProfileSummary | null;
    openedAt: string;
    closedAt?: string | null;
    archivedAt?: string;
    purgeAt?: string;
  },
): string {
  const lines: string[] = [
    `# Support Transcript: ${transcript.subject}`,
    "",
    `- **Customer:** ${supportDisplayName(meta.customer)}`,
    `- **Staff:** ${meta.staff ? supportDisplayName(meta.staff) : "Unassigned"}`,
    `- **Category:** ${transcript.category ?? "—"}`,
    `- **AI Escalated:** ${transcript.ai_escalated ? "Yes" : "No"}`,
    `- **Opened:** ${meta.openedAt}`,
    `- **Closed:** ${meta.closedAt ?? "—"}`,
  ];

  if (meta.archivedAt) lines.push(`- **Archived:** ${meta.archivedAt}`);
  if (meta.purgeAt) lines.push(`- **Scheduled deletion:** ${meta.purgeAt}`);

  if (transcript.ai_messages?.length) {
    lines.push("", "## AI Conversation", "");
    for (const msg of transcript.ai_messages) {
      const role = msg.role === "user" ? "Customer" : msg.role === "assistant" ? "cried AI" : "System";
      lines.push(`### ${role} — ${msg.created_at}`, "", msg.body, "");
    }
  }

  lines.push("", "## Ticket Messages", "");
  for (const msg of transcript.messages) {
    const role = msg.is_staff ? "Staff" : "Customer";
    lines.push(`### ${role} (${msg.author_name}) — ${msg.created_at}`, "", msg.body, "");
    if (msg.attachments?.length) {
      lines.push(
        "_Attachments:_ " + msg.attachments.map((a) => a.file_name).join(", "),
        "",
      );
    }
  }

  if (transcript.internal_notes.length) {
    lines.push("", "## Staff Notes (Internal)", "");
    for (const note of transcript.internal_notes) {
      lines.push(`### ${note.author_name} — ${note.created_at}`, "", note.body, "");
    }
  }

  if (transcript.status_history.length) {
    lines.push("", "## Status History", "");
    for (const entry of transcript.status_history) {
      lines.push(`- ${entry.changed_at}: **${entry.status}**${entry.note ? ` — ${entry.note}` : ""}`);
    }
  }

  return lines.join("\n");
}

export function formatAiTranscriptForTicket(aiMessages: SupportAiMessage[]): string {
  if (aiMessages.length === 0) return "";
  const lines = ["📋 **AI Conversation Transcript**", ""];
  for (const msg of aiMessages) {
    if (msg.role === "system") continue;
    const label = msg.role === "user" ? "Customer" : "cried AI";
    lines.push(`**${label}:** ${msg.body}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}
