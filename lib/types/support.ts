export type SupportConversationStatus =
  | "open"
  | "waiting_on_staff"
  | "waiting_on_user"
  | "in_progress"
  | "ai_assisting"
  | "closed"
  | "archived";

export type SupportCategory =
  | "billing"
  | "premium"
  | "profile"
  | "badges"
  | "presets"
  | "layouts"
  | "widgets"
  | "music"
  | "backgrounds"
  | "effects"
  | "import_export"
  | "account"
  | "bug"
  | "other";

export type SupportAiSessionStatus = "active" | "resolved" | "escalated";

export type SupportProfileSummary = {
  id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
};

export type SupportStatusHistoryEntry = {
  status: SupportConversationStatus;
  changed_at: string;
  changed_by?: string | null;
  note?: string;
};

export type SupportConversation = {
  id: string;
  user_id: string;
  subject: string;
  status: SupportConversationStatus;
  assigned_to: string | null;
  is_priority: boolean;
  is_pinned: boolean;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
  category?: SupportCategory | string | null;
  ai_escalated?: boolean;
  ai_session_id?: string | null;
  closed_at?: string | null;
  first_staff_response_at?: string | null;
  status_history?: SupportStatusHistoryEntry[];
  customer?: SupportProfileSummary | null;
  assignee?: SupportProfileSummary | null;
  unread_count?: number;
};

export type SupportMessage = {
  id: string;
  conversation_id: string;
  author_id: string;
  body: string;
  is_staff: boolean;
  read_at: string | null;
  created_at: string;
  author?: SupportProfileSummary | null;
  attachments?: SupportAttachment[];
};

export type SupportAttachment = {
  id: string;
  message_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  url?: string | null;
};

export type SupportInternalNote = {
  id: string;
  conversation_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: SupportProfileSummary | null;
};

export type SupportAiMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  body: string;
  created_at: string;
};

export type SupportAiSession = {
  id: string;
  user_id: string;
  status: SupportAiSessionStatus;
  category: SupportCategory | string | null;
  conversation_id: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
  messages?: SupportAiMessage[];
};

export type SupportArchivedTranscript = {
  id: string;
  original_conversation_id: string | null;
  user_id: string | null;
  subject: string;
  category: SupportCategory | string | null;
  ai_escalated: boolean;
  assigned_staff_id: string | null;
  customer_snapshot: Record<string, unknown>;
  staff_snapshot: Record<string, unknown> | null;
  transcript: SupportTranscriptPayload;
  status_history: SupportStatusHistoryEntry[];
  opened_at: string;
  closed_at: string | null;
  archived_at: string;
  purge_at: string;
  restored_conversation_id: string | null;
  customer?: SupportProfileSummary | null;
  staff?: SupportProfileSummary | null;
};

export type SupportTranscriptMessage = {
  id: string;
  author_id: string;
  author_name: string;
  is_staff: boolean;
  body: string;
  created_at: string;
  attachments?: Array<{
    id: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
  }>;
};

export type SupportTranscriptPayload = {
  subject: string;
  category: string | null;
  ai_escalated: boolean;
  ai_messages?: SupportAiMessage[];
  messages: SupportTranscriptMessage[];
  internal_notes: Array<{
    id: string;
    author_name: string;
    body: string;
    created_at: string;
  }>;
  status_history: SupportStatusHistoryEntry[];
};

export type SupportInboxFilters = {
  status?: SupportConversationStatus | "all";
  assigned?: "all" | "me" | "unassigned";
  search?: string;
  priorityOnly?: boolean;
};

export type SupportAnalytics = {
  openCount: number;
  closedCount: number;
  waitingOnStaff: number;
  waitingOnUser: number;
  inProgress: number;
  aiAssisting: number;
  avgFirstResponseMinutes: number | null;
  resolvedThisWeek: number;
  closedToday: number;
  archivedTranscriptCount: number;
  aiResolutionRate: number | null;
  humanResolutionRate: number | null;
  avgAiConversationLength: number | null;
  avgHumanResponseMinutes: number | null;
  avgResolutionMinutes: number | null;
  aiEscalationPercentage: number | null;
};

export type SupportActionState = {
  error?: string;
  success?: string;
  conversationId?: string;
  messageId?: string;
  sessionId?: string;
  shouldEscalate?: boolean;
  aiReply?: string;
};

export type SupportActionError = { error: string };

export type SupportConversationDetail = {
  conversation: SupportConversation;
  messages: SupportMessage[];
  aiMessages?: SupportAiMessage[];
};

export type SupportConversationDetailResult = SupportActionError | SupportConversationDetail;

export type UserSupportInboxResult =
  | SupportActionError
  | {
      conversations: SupportConversation[];
      userId: string;
    };

export type AdminSupportInboxResult =
  | SupportActionError
  | {
      conversations: SupportConversation[];
      staffUserId: string;
    };

export type AdminSupportDetailResult =
  | SupportActionError
  | (SupportConversationDetail & {
      notes: SupportInternalNote[];
      aiMessages: SupportAiMessage[];
      staffUserId: string;
    });

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  billing: "Billing & Payments",
  premium: "Premium Features",
  profile: "Profile Customization",
  badges: "Badges",
  presets: "Presets",
  layouts: "Layouts",
  widgets: "Widgets",
  music: "Music Player",
  backgrounds: "Backgrounds",
  effects: "Effects & Borders",
  import_export: "Import / Export",
  account: "Account Access",
  bug: "Bug Report",
  other: "Other",
};

export const SUPPORT_STATUS_LABELS: Record<SupportConversationStatus, string> = {
  open: "Open",
  waiting_on_staff: "Waiting on Staff",
  waiting_on_user: "Waiting on Customer",
  in_progress: "In Progress",
  ai_assisting: "AI Assisting",
  closed: "Closed",
  archived: "Archived",
};

export const SUPPORT_STATUS_EMOJI: Record<SupportConversationStatus, string> = {
  open: "🟢",
  waiting_on_staff: "🟢",
  waiting_on_user: "🟡",
  in_progress: "🔵",
  ai_assisting: "🟣",
  closed: "🔴",
  archived: "⚫",
};

export const SUPPORT_QUICK_REPLIES = [
  "Thanks for reaching out! We're looking into this now.",
  "Could you share a screenshot or more details?",
  "This has been resolved — let us know if you need anything else.",
  "We've escalated this to our team and will follow up shortly.",
];

const VALID_STATUSES = new Set<SupportConversationStatus>([
  "open",
  "waiting_on_staff",
  "waiting_on_user",
  "in_progress",
  "ai_assisting",
  "closed",
  "archived",
]);

export function normalizeSupportStatus(status: unknown): SupportConversationStatus {
  if (typeof status === "string" && VALID_STATUSES.has(status as SupportConversationStatus)) {
    return status as SupportConversationStatus;
  }
  return "open";
}

export function getSupportStatusDisplay(status: unknown) {
  const normalized = normalizeSupportStatus(status);
  return {
    status: normalized,
    emoji: SUPPORT_STATUS_EMOJI[normalized],
    label: SUPPORT_STATUS_LABELS[normalized],
  };
}

export function isSupportTicketActive(status: SupportConversationStatus): boolean {
  return status !== "closed" && status !== "archived";
}

export const SUPPORT_AI_ESCALATION_PROMPT =
  "It looks like this issue needs a member of our support team. Would you like me to create a ticket and send our conversation to the staff?";
