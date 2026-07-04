export type SupportConversationStatus =
  | "open"
  | "waiting_on_staff"
  | "waiting_on_user"
  | "closed";

export type SupportProfileSummary = {
  id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
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
  avgFirstResponseMinutes: number | null;
  resolvedThisWeek: number;
};

export type SupportActionState = {
  error?: string;
  success?: string;
  conversationId?: string;
  messageId?: string;
};

export type SupportConversationDetail = {
  conversation: SupportConversation;
  messages: SupportMessage[];
};

export type AdminSupportDetailResult =
  | { error: string }
  | (SupportConversationDetail & {
      notes: SupportInternalNote[];
      staffUserId: string;
    });

export const SUPPORT_STATUS_LABELS: Record<SupportConversationStatus, string> = {
  open: "Open",
  waiting_on_staff: "Waiting on Staff",
  waiting_on_user: "Waiting on User",
  closed: "Closed",
};

export const SUPPORT_STATUS_EMOJI: Record<SupportConversationStatus, string> = {
  open: "🟢",
  waiting_on_staff: "🟡",
  waiting_on_user: "🔵",
  closed: "⚫",
};

export const SUPPORT_QUICK_REPLIES = [
  "Thanks for reaching out! We're looking into this now.",
  "Could you share a screenshot or more details?",
  "This has been resolved — let us know if you need anything else.",
  "We've escalated this to our team and will follow up shortly.",
];
