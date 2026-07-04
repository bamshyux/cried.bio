import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  SupportAnalytics,
  SupportAttachment,
  SupportConversation,
  SupportConversationStatus,
  SupportInboxFilters,
  SupportInternalNote,
  SupportMessage,
  SupportProfileSummary,
} from "@/lib/types/support";

const PROFILE_SELECT = "id, username, display_name, avatar_url";

function mapProfile(row: Record<string, unknown> | null | undefined): SupportProfileSummary | null {
  if (!row || typeof row.id !== "string") return null;
  return {
    id: row.id,
    username: (row.username as string | null) ?? null,
    display_name: (row.display_name as string) ?? "User",
    avatar_url: (row.avatar_url as string | null) ?? null,
  };
}

type ConversationRow = {
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
};

function mapConversationRow(
  row: ConversationRow,
  profileMap: Map<string, SupportProfileSummary>,
): SupportConversation {
  return {
    id: row.id,
    user_id: row.user_id,
    subject: row.subject,
    status: row.status,
    assigned_to: row.assigned_to,
    is_priority: Boolean(row.is_priority),
    is_pinned: Boolean(row.is_pinned),
    last_message_at: row.last_message_at,
    last_message_preview: row.last_message_preview,
    created_at: row.created_at,
    updated_at: row.updated_at,
    customer: profileMap.get(row.user_id) ?? null,
    assignee: row.assigned_to ? profileMap.get(row.assigned_to) ?? null : null,
  };
}

async function db() {
  return createAdminClient() ?? (await createClient());
}

async function loadProfileMap(ids: string[]): Promise<Map<string, SupportProfileSummary>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const supabase = await db();
  const { data, error } = await supabase.from("profiles").select(PROFILE_SELECT).in("id", unique);
  if (error) {
    console.error("[support] loadProfileMap:", error.message);
    return new Map();
  }

  const map = new Map<string, SupportProfileSummary>();
  for (const row of data ?? []) {
    const profile = mapProfile(row as Record<string, unknown>);
    if (profile) map.set(profile.id, profile);
  }
  return map;
}

function conversationProfileIds(rows: Array<{ user_id: string; assigned_to?: string | null }>) {
  const ids: string[] = [];
  for (const row of rows) {
    ids.push(row.user_id);
    if (row.assigned_to) ids.push(row.assigned_to);
  }
  return ids;
}

export async function listUserSupportConversations(
  userId: string,
  search?: string,
): Promise<SupportConversation[]> {
  const supabase = await db();
  let query = supabase
    .from("support_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (search?.trim()) {
    query = query.ilike("subject", `%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[support] listUserSupportConversations:", error.message);
    return [];
  }

  const rows = (data ?? []) as ConversationRow[];
  const profileMap = await loadProfileMap(conversationProfileIds(rows));
  const conversations = rows.map((row) => mapConversationRow(row, profileMap));
  return attachUnreadCounts(conversations, userId, false);
}

export async function listAdminSupportConversations(
  staffUserId: string,
  filters: SupportInboxFilters = {},
): Promise<SupportConversation[]> {
  const supabase = await db();
  let query = supabase
    .from("support_conversations")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("is_priority", { ascending: false })
    .order("updated_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.assigned === "me") {
    query = query.eq("assigned_to", staffUserId);
  } else if (filters.assigned === "unassigned") {
    query = query.is("assigned_to", null);
  }

  if (filters.priorityOnly) {
    query = query.eq("is_priority", true);
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim();
    query = query.ilike("subject", `%${term}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[support] listAdminSupportConversations:", error.message);
    return [];
  }

  const rows = (data ?? []) as ConversationRow[];
  const profileMap = await loadProfileMap(conversationProfileIds(rows));
  const conversations = rows.map((row) => mapConversationRow(row, profileMap));
  return attachUnreadCounts(conversations, staffUserId, true);
}

async function attachUnreadCounts(
  conversations: SupportConversation[],
  viewerId: string,
  isStaff: boolean,
): Promise<SupportConversation[]> {
  if (conversations.length === 0) return conversations;

  const supabase = await db();
  const ids = conversations.map((c) => c.id);

  const { data: messages } = await supabase
    .from("support_messages")
    .select("conversation_id, author_id, is_staff, read_at")
    .in("conversation_id", ids);

  const unreadByConversation = new Map<string, number>();
  for (const message of messages ?? []) {
    const isFromOther = isStaff ? message.is_staff === false : message.author_id !== viewerId;
    if (!isFromOther) continue;
    if (message.read_at) continue;
    unreadByConversation.set(
      message.conversation_id,
      (unreadByConversation.get(message.conversation_id) ?? 0) + 1,
    );
  }

  return conversations.map((conversation) => ({
    ...conversation,
    unread_count: unreadByConversation.get(conversation.id) ?? 0,
  }));
}

export async function getSupportConversationById(
  conversationId: string,
  viewerId: string,
  isStaff: boolean,
): Promise<SupportConversation | null> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("support_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    console.error("[support] getSupportConversationById:", error.message);
    return null;
  }
  if (!data) return null;

  const row = data as ConversationRow;
  if (!isStaff && row.user_id !== viewerId) return null;

  const profileMap = await loadProfileMap(conversationProfileIds([row]));
  const conversation = mapConversationRow(row, profileMap);
  const [withUnread] = await attachUnreadCounts([conversation], viewerId, isStaff);
  return withUnread;
}

export async function getSupportMessages(conversationId: string): Promise<SupportMessage[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("support_messages")
    .select("*, attachments:support_attachments(*)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[support] getSupportMessages:", error.message);
    return [];
  }

  const rows = data ?? [];
  const authorIds = rows.map((row) => row.author_id as string);
  const profileMap = await loadProfileMap(authorIds);

  return rows.map((row) => {
    const attachmentsRaw = row.attachments as Record<string, unknown>[] | null;
    return {
      id: row.id as string,
      conversation_id: row.conversation_id as string,
      author_id: row.author_id as string,
      body: row.body as string,
      is_staff: Boolean(row.is_staff),
      read_at: (row.read_at as string | null) ?? null,
      created_at: row.created_at as string,
      author: profileMap.get(row.author_id as string) ?? null,
      attachments: (attachmentsRaw ?? []).map((item) => ({
        id: item.id as string,
        message_id: item.message_id as string,
        storage_path: item.storage_path as string,
        file_name: item.file_name as string,
        mime_type: item.mime_type as string,
        size_bytes: item.size_bytes as number,
        created_at: item.created_at as string,
      })),
    };
  });
}

export async function getSupportInternalNotes(
  conversationId: string,
): Promise<SupportInternalNote[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("support_internal_notes")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[support] getSupportInternalNotes:", error.message);
    return [];
  }

  const rows = data ?? [];
  const profileMap = await loadProfileMap(rows.map((row) => row.author_id as string));

  return rows.map((row) => ({
    id: row.id as string,
    conversation_id: row.conversation_id as string,
    author_id: row.author_id as string,
    body: row.body as string,
    created_at: row.created_at as string,
    author: profileMap.get(row.author_id as string) ?? null,
  }));
}

export async function getUserSupportUnreadTotal(userId: string): Promise<number> {
  const conversations = await listUserSupportConversations(userId);
  return conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);
}

export async function getAdminSupportUnreadTotal(staffUserId: string): Promise<number> {
  const conversations = await listAdminSupportConversations(staffUserId);
  return conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);
}

export async function listPlatformAdminUserIds(): Promise<string[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("profiles")
    .select("id, role, is_admin")
    .or("role.eq.admin,role.eq.owner,is_admin.eq.true");

  return (data ?? []).map((row) => row.id as string);
}

export async function getSupportAnalytics(): Promise<SupportAnalytics> {
  const supabase = await db();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: conversations } = await supabase
    .from("support_conversations")
    .select("id, status, created_at, updated_at");

  const rows = conversations ?? [];
  const openCount = rows.filter((r) => r.status !== "closed").length;
  const closedCount = rows.filter((r) => r.status === "closed").length;
  const waitingOnStaff = rows.filter((r) => r.status === "waiting_on_staff").length;
  const waitingOnUser = rows.filter((r) => r.status === "waiting_on_user").length;
  const resolvedThisWeek = rows.filter(
    (r) => r.status === "closed" && r.updated_at >= weekAgo,
  ).length;

  let avgFirstResponseMinutes: number | null = null;
  const { data: staffMessages } = await supabase
    .from("support_messages")
    .select("conversation_id, created_at")
    .eq("is_staff", true)
    .order("created_at", { ascending: true });

  if (staffMessages && staffMessages.length > 0) {
    const firstStaffByConversation = new Map<string, string>();
    for (const msg of staffMessages) {
      if (!firstStaffByConversation.has(msg.conversation_id)) {
        firstStaffByConversation.set(msg.conversation_id, msg.created_at);
      }
    }

    const deltas: number[] = [];
    for (const row of rows) {
      const firstStaffAt = firstStaffByConversation.get(row.id);
      if (!firstStaffAt) continue;
      const delta =
        (new Date(firstStaffAt).getTime() - new Date(row.created_at).getTime()) / 60000;
      if (delta >= 0) deltas.push(delta);
    }

    if (deltas.length > 0) {
      avgFirstResponseMinutes = Math.round(
        deltas.reduce((a, b) => a + b, 0) / deltas.length,
      );
    }
  }

  return {
    openCount,
    closedCount,
    waitingOnStaff,
    waitingOnUser,
    avgFirstResponseMinutes,
    resolvedThisWeek,
  };
}

export async function listStaffProfiles(): Promise<SupportProfileSummary[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .or("role.eq.admin,role.eq.owner,is_admin.eq.true")
    .order("display_name");

  if (error) {
    console.error("[support] listStaffProfiles:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => mapProfile(row as Record<string, unknown>))
    .filter((profile): profile is SupportProfileSummary => profile !== null);
}

export async function signSupportAttachmentUrls(
  attachments: SupportAttachment[],
): Promise<SupportAttachment[]> {
  if (attachments.length === 0) return attachments;

  return attachments.map((attachment) => ({
    ...attachment,
    url: `/api/support/attachment/${attachment.id}`,
  }));
}
