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

function mapConversation(row: Record<string, unknown>): SupportConversation {
  const customerRaw = row.customer as Record<string, unknown> | Record<string, unknown>[] | null;
  const assigneeRaw = row.assignee as Record<string, unknown> | Record<string, unknown>[] | null;
  const customer = Array.isArray(customerRaw) ? customerRaw[0] : customerRaw;
  const assignee = Array.isArray(assigneeRaw) ? assigneeRaw[0] : assigneeRaw;

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    subject: row.subject as string,
    status: row.status as SupportConversationStatus,
    assigned_to: (row.assigned_to as string | null) ?? null,
    is_priority: Boolean(row.is_priority),
    is_pinned: Boolean(row.is_pinned),
    last_message_at: (row.last_message_at as string | null) ?? null,
    last_message_preview: (row.last_message_preview as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    customer: mapProfile(customer),
    assignee: mapProfile(assignee),
    unread_count: typeof row.unread_count === "number" ? row.unread_count : undefined,
  };
}

function mapMessage(row: Record<string, unknown>): SupportMessage {
  const authorRaw = row.author as Record<string, unknown> | Record<string, unknown>[] | null;
  const attachmentsRaw = row.attachments as Record<string, unknown>[] | null;
  const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw;

  return {
    id: row.id as string,
    conversation_id: row.conversation_id as string,
    author_id: row.author_id as string,
    body: row.body as string,
    is_staff: Boolean(row.is_staff),
    read_at: (row.read_at as string | null) ?? null,
    created_at: row.created_at as string,
    author: mapProfile(author),
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
}

async function db() {
  return createAdminClient() ?? (await createClient());
}

export async function listUserSupportConversations(
  userId: string,
  search?: string,
): Promise<SupportConversation[]> {
  const supabase = await db();
  let query = supabase
    .from("support_conversations")
    .select(
      `*,
      customer:profiles!support_conversations_user_id_fkey(${PROFILE_SELECT}),
      assignee:profiles!support_conversations_assigned_to_fkey(${PROFILE_SELECT})`,
    )
    .eq("user_id", userId)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (search?.trim()) {
    query = query.ilike("subject", `%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const conversations = (data ?? []).map((row) => mapConversation(row as Record<string, unknown>));
  return attachUnreadCounts(conversations, userId, false);
}

export async function listAdminSupportConversations(
  staffUserId: string,
  filters: SupportInboxFilters = {},
): Promise<SupportConversation[]> {
  const supabase = await db();
  let query = supabase
    .from("support_conversations")
    .select(
      `*,
      customer:profiles!support_conversations_user_id_fkey(${PROFILE_SELECT}),
      assignee:profiles!support_conversations_assigned_to_fkey(${PROFILE_SELECT})`,
    )
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
    query = query.or(`subject.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const conversations = (data ?? []).map((row) => mapConversation(row as Record<string, unknown>));
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
    .select(
      `*,
      customer:profiles!support_conversations_user_id_fkey(${PROFILE_SELECT}),
      assignee:profiles!support_conversations_assigned_to_fkey(${PROFILE_SELECT})`,
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const conversation = mapConversation(data as Record<string, unknown>);
  if (!isStaff && conversation.user_id !== viewerId) return null;

  const [withUnread] = await attachUnreadCounts([conversation], viewerId, isStaff);
  return withUnread;
}

export async function getSupportMessages(conversationId: string): Promise<SupportMessage[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("support_messages")
    .select(
      `*,
      author:profiles!support_messages_author_id_fkey(${PROFILE_SELECT}),
      attachments:support_attachments(*)`,
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapMessage(row as Record<string, unknown>));
}

export async function getSupportInternalNotes(
  conversationId: string,
): Promise<SupportInternalNote[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("support_internal_notes")
    .select(
      `*,
      author:profiles!support_internal_notes_author_id_fkey(${PROFILE_SELECT})`,
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const authorRaw = row.author as Record<string, unknown> | Record<string, unknown>[] | null;
    const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw;
    return {
      id: row.id as string,
      conversation_id: row.conversation_id as string,
      author_id: row.author_id as string,
      body: row.body as string,
      created_at: row.created_at as string,
      author: mapProfile(author),
    };
  });
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
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .or("role.eq.admin,role.eq.owner,is_admin.eq.true")
    .order("display_name");

  return (data ?? []).map((row) => mapProfile(row as Record<string, unknown>)!);
}

export async function signSupportAttachmentUrls(
  attachments: SupportAttachment[],
): Promise<SupportAttachment[]> {
  if (attachments.length === 0) return attachments;

  const supabase = await db();
  const signed = await Promise.all(
    attachments.map(async (attachment) => {
      const { data } = await supabase.storage
        .from("support-attachments")
        .createSignedUrl(attachment.storage_path, 3600);
      return { ...attachment, url: data?.signedUrl ?? null };
    }),
  );

  return signed;
}
