"use server";

import { revalidatePath } from "next/cache";
import { logAdminAudit } from "@/lib/admin/audit";
import { getAdminAccess, isAdminUser, type AdminAccess } from "@/lib/auth/admin-access";
import { createNotification } from "@/lib/data/notifications";
import {
  getSupportConversationById,
  getSupportInternalNotes,
  getSupportMessages,
  getSupportAiMessages,
  listPlatformAdminUserIds,
  listUserSupportConversations,
  signSupportAttachmentUrls,
} from "@/lib/data/support";
import { buildSupportTranscriptPayload } from "@/lib/support/transcript";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminSupportDetailResult,
  AdminSupportInboxResult,
  SupportActionError,
  SupportActionState,
  SupportConversationDetailResult,
  SupportConversationStatus,
  SupportStatusHistoryEntry,
  UserSupportInboxResult,
} from "@/lib/types/support";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
]);

async function db() {
  return createAdminClient() ?? (await createClient());
}

type AuthUser = { userId: string; email: string };

async function requireUser(): Promise<AuthUser | SupportActionError> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return { error: "You must be signed in." };
  return { userId: data.claims.sub as string, email: (data.claims.email as string) ?? "" };
}

async function requireStaff(): Promise<AdminAccess | SupportActionError> {
  const access = await getAdminAccess();
  if (!access) return { error: "Admin access required." };
  return access;
}

function revalidateSupport() {
  revalidatePath("/", "layout");
  revalidatePath("/dashboard/admin/support");
  revalidatePath("/dashboard/admin/support/archives");
}

function nextStatusAfterMessage(isStaff: boolean): SupportConversationStatus {
  return isStaff ? "waiting_on_user" : "waiting_on_staff";
}

function appendStatusHistory(
  existing: SupportStatusHistoryEntry[] | undefined,
  status: SupportConversationStatus,
  changedBy?: string,
  note?: string,
): SupportStatusHistoryEntry[] {
  return [
    ...(existing ?? []),
    {
      status,
      changed_at: new Date().toISOString(),
      changed_by: changedBy ?? null,
      note,
    },
  ];
}

async function notifyAdminsNewTicket(
  conversationId: string,
  subject: string,
  customerId: string,
  customerEmail: string,
  messagePreview: string,
  customerProfile?: { username?: string | null; display_name?: string | null },
) {
  const adminIds = await listPlatformAdminUserIds();
  await Promise.all(
    adminIds
      .filter((id) => id !== customerId)
      .map((adminId) =>
        createNotification({
          userId: adminId,
          type: "support_new_ticket",
          title: "New support ticket",
          body: subject,
          actorId: customerId,
          data: { conversationId },
        }),
      ),
  );

  const { sendSupportTicketDiscordAlert } = await import("@/lib/discord/support-webhook");
  await sendSupportTicketDiscordAlert({
    conversationId,
    subject,
    messagePreview,
    customerEmail,
    customerId,
    customerUsername: customerProfile?.username,
    customerDisplayName: customerProfile?.display_name,
  });
}

export async function createSupportConversationAction(
  subject: string,
  initialMessage: string,
): Promise<SupportActionState> {
  const user = await requireUser();
  if ("error" in user) return user;

  const trimmedSubject = subject.trim();
  const trimmedMessage = initialMessage.trim();
  if (!trimmedSubject) return { error: "Subject is required." };
  if (!trimmedMessage) return { error: "Message or attachment is required." };

  const messageBody = trimmedMessage;
  const previewBody = messageBody === "(attachment)" ? "Sent an attachment" : messageBody;

  const supabase = await db();
  const now = new Date().toISOString();

  const { data: conversation, error: conversationError } = await supabase
    .from("support_conversations")
    .insert({
      user_id: user.userId,
      subject: trimmedSubject,
      status: "waiting_on_staff",
      last_message_at: now,
      last_message_preview: previewBody.slice(0, 160),
      updated_at: now,
    })
    .select("id")
    .single();

  if (conversationError || !conversation) {
    return { error: conversationError?.message ?? "Could not create conversation." };
  }

  const { data: message, error: messageError } = await supabase
    .from("support_messages")
    .insert({
      conversation_id: conversation.id,
      author_id: user.userId,
      body: messageBody,
      is_staff: false,
    })
    .select("id")
    .single();

  if (messageError) {
    return { error: messageError.message };
  }

  const { data: customerProfile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.userId)
    .maybeSingle();

  await notifyAdminsNewTicket(
    conversation.id,
    trimmedSubject,
    user.userId,
    user.email,
    previewBody,
    customerProfile ?? undefined,
  );
  revalidateSupport();

  return {
    success: "Conversation started.",
    conversationId: conversation.id,
    messageId: message?.id,
  };
}

export async function sendSupportMessageAction(input: {
  conversationId: string;
  body: string;
  asStaff?: boolean;
}): Promise<SupportActionState> {
  const trimmedBody = input.body.trim();
  if (!trimmedBody) return { error: "Message cannot be empty." };

  const supabase = await db();
  let authorId: string;
  let isStaff = false;
  let staffEmail = "";

  if (input.asStaff) {
    const access = await requireStaff();
    if ("error" in access) return access;
    authorId = access.userId;
    isStaff = true;
    staffEmail = access.email;
  } else {
    const user = await requireUser();
    if ("error" in user) return user;
    authorId = user.userId;
  }

  const conversation = await getSupportConversationById(
    input.conversationId,
    authorId,
    isStaff,
  );
  if (!conversation) return { error: "Conversation not found." };
  if (conversation.status === "closed") {
    return { error: "This conversation is closed. Re-open it to reply." };
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    status: nextStatusAfterMessage(isStaff),
    last_message_at: now,
    last_message_preview: trimmedBody.slice(0, 160),
    updated_at: now,
  };

  if (isStaff && !conversation.first_staff_response_at) {
    updates.first_staff_response_at = now;
    if (conversation.status === "waiting_on_staff") {
      updates.status = "in_progress";
    }
  }

  if (isStaff && !conversation.assigned_to) {
    updates.assigned_to = authorId;
  }

  updates.status_history = appendStatusHistory(
    conversation.status_history,
    updates.status as SupportConversationStatus,
    authorId,
    isStaff ? "Staff replied" : "Customer replied",
  );

  const { error: updateError } = await supabase
    .from("support_conversations")
    .update(updates)
    .eq("id", input.conversationId);

  if (updateError) return { error: updateError.message };

  const { data: message, error: messageError } = await supabase
    .from("support_messages")
    .insert({
      conversation_id: input.conversationId,
      author_id: authorId,
      body: trimmedBody,
      is_staff: isStaff,
    })
    .select("id")
    .single();

  if (messageError) return { error: messageError.message };

  if (isStaff) {
    await createNotification({
      userId: conversation.user_id,
      type: "support_reply",
      title: "Support replied",
      body: trimmedBody.slice(0, 120),
      actorId: authorId,
      data: { conversationId: input.conversationId },
    });

    if (staffEmail) {
      await logAdminAudit({
        actorId: authorId,
        actorEmail: staffEmail,
        action: "support_reply",
        targetUserId: conversation.user_id,
        details: { conversationId: input.conversationId },
      });
    }
  } else if (conversation.assigned_to) {
    await createNotification({
      userId: conversation.assigned_to,
      type: "support_reply",
      title: "User replied to support ticket",
      body: trimmedBody.slice(0, 120),
      actorId: authorId,
      data: { conversationId: input.conversationId },
    });
  } else {
    const adminIds = await listPlatformAdminUserIds();
    await Promise.all(
      adminIds
        .filter((id) => id !== authorId)
        .map((adminId) =>
          createNotification({
            userId: adminId,
            type: "support_reply",
            title: "User replied to support ticket",
            body: trimmedBody.slice(0, 120),
            actorId: authorId,
            data: { conversationId: input.conversationId },
          }),
        ),
    );
  }

  revalidateSupport();
  return { success: "Message sent.", messageId: message?.id };
}

export async function closeSupportConversationAction(
  conversationId: string,
  asStaff = false,
): Promise<SupportActionState> {
  const supabase = await db();
  let userId: string;
  let isStaff = asStaff;

  if (asStaff) {
    const access = await requireStaff();
    if ("error" in access) return access;
    userId = access.userId;
  } else {
    const user = await requireUser();
    if ("error" in user) return user;
    userId = user.userId;
    isStaff = false;
  }

  const conversation = await getSupportConversationById(conversationId, userId, isStaff);
  if (!conversation) return { error: "Conversation not found." };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("support_conversations")
    .update({
      status: "closed",
      closed_at: now,
      updated_at: now,
      status_history: appendStatusHistory(
        conversation.status_history,
        "closed",
        userId,
        isStaff ? "Closed by staff" : "Closed by customer",
      ),
    })
    .eq("id", conversationId);

  if (error) return { error: error.message };

  if (isStaff) {
    await createNotification({
      userId: conversation.user_id,
      type: "support_closed",
      title: "Support ticket closed",
      body: conversation.subject,
      data: { conversationId },
    });
  }

  revalidateSupport();
  return { success: "Conversation closed." };
}

export async function reopenSupportConversationAction(
  conversationId: string,
  asStaff = false,
): Promise<SupportActionState> {
  const supabase = await db();
  let userId: string;
  let isStaff = asStaff;

  if (asStaff) {
    const access = await requireStaff();
    if ("error" in access) return access;
    userId = access.userId;
  } else {
    const user = await requireUser();
    if ("error" in user) return user;
    userId = user.userId;
    isStaff = false;
  }

  const conversation = await getSupportConversationById(conversationId, userId, isStaff);
  if (!conversation) return { error: "Conversation not found." };

  const newStatus: SupportConversationStatus = isStaff ? "waiting_on_user" : "waiting_on_staff";
  const { error } = await supabase
    .from("support_conversations")
    .update({
      status: newStatus,
      closed_at: null,
      updated_at: new Date().toISOString(),
      status_history: appendStatusHistory(
        conversation.status_history,
        newStatus,
        userId,
        "Ticket reopened",
      ),
    })
    .eq("id", conversationId);

  if (error) return { error: error.message };

  if (isStaff) {
    await createNotification({
      userId: conversation.user_id,
      type: "support_reopened",
      title: "Support ticket reopened",
      body: conversation.subject,
      data: { conversationId },
    });
  } else if (conversation.assigned_to) {
    await createNotification({
      userId: conversation.assigned_to,
      type: "support_reopened",
      title: "User reopened support ticket",
      body: conversation.subject,
      actorId: userId,
      data: { conversationId },
    });
  }

  revalidateSupport();
  return { success: "Conversation reopened." };
}

export async function deleteSupportConversationAction(
  conversationId: string,
  asStaff = false,
): Promise<SupportActionState> {
  const supabase = await db();
  let userId: string;
  let isStaff = asStaff;
  let staffEmail = "";

  if (asStaff) {
    const access = await requireStaff();
    if ("error" in access) return access;
    userId = access.userId;
    staffEmail = access.email;
  } else {
    const user = await requireUser();
    if ("error" in user) return user;
    userId = user.userId;
    isStaff = false;
  }

  const conversation = await getSupportConversationById(conversationId, userId, isStaff);
  if (!conversation) return { error: "Conversation not found." };
  if (conversation.status !== "closed") {
    return { error: "Only closed tickets can be deleted." };
  }

  const messages = await getSupportMessages(conversationId);
  const notes = isStaff ? await getSupportInternalNotes(conversationId) : [];
  const aiMessages = conversation.ai_session_id
    ? await getSupportAiMessages(conversation.ai_session_id)
    : [];

  const storagePaths = messages.flatMap(
    (message) => message.attachments?.map((attachment) => attachment.storage_path) ?? [],
  );

  const customerSnapshot = conversation.customer
    ? {
        id: conversation.customer.id,
        username: conversation.customer.username,
        display_name: conversation.customer.display_name,
      }
    : { id: conversation.user_id };

  const staffSnapshot = conversation.assignee
    ? {
        id: conversation.assignee.id,
        username: conversation.assignee.username,
        display_name: conversation.assignee.display_name,
      }
    : null;

  const transcript = buildSupportTranscriptPayload({
    conversation,
    messages,
    notes,
    aiMessages,
  });

  const archivedAt = new Date();
  const purgeAt = new Date(archivedAt.getTime() + 72 * 60 * 60 * 1000);

  const { error: archiveError } = await supabase.from("support_archived_transcripts").insert({
    original_conversation_id: conversationId,
    user_id: conversation.user_id,
    subject: conversation.subject,
    category: conversation.category ?? null,
    ai_escalated: Boolean(conversation.ai_escalated),
    assigned_staff_id: conversation.assigned_to,
    customer_snapshot: customerSnapshot,
    staff_snapshot: staffSnapshot,
    transcript,
    status_history: conversation.status_history ?? [],
    opened_at: conversation.created_at,
    closed_at: conversation.closed_at ?? conversation.updated_at,
    archived_at: archivedAt.toISOString(),
    purge_at: purgeAt.toISOString(),
  });

  if (archiveError) {
    console.error("[support] archive before delete:", archiveError.message);
  }

  const { error } = await supabase
    .from("support_conversations")
    .delete()
    .eq("id", conversationId);

  if (error) return { error: error.message };

  if (storagePaths.length > 0) {
    const admin = createAdminClient();
    if (admin) {
      const { error: storageError } = await admin.storage
        .from("support-attachments")
        .remove(storagePaths);
      if (storageError) {
        console.error("[support] attachment cleanup failed:", storageError.message);
      }
    }
  }

  if (isStaff && staffEmail) {
    await logAdminAudit({
      actorId: userId,
      actorEmail: staffEmail,
      action: "support_delete",
      targetUserId: conversation.user_id,
      details: { conversationId, subject: conversation.subject },
    });
  }

  revalidateSupport();
  return { success: "Ticket deleted." };
}

export async function assignSupportConversationAction(
  conversationId: string,
  assigneeId?: string | null,
): Promise<SupportActionState> {
  const access = await requireStaff();
  if ("error" in access) return access;

  const targetId = assigneeId ?? access.userId;
  if (!(await isAdminUser(targetId))) {
    return { error: "Assignee must be a staff member." };
  }

  const supabase = await db();
  const { error } = await supabase
    .from("support_conversations")
    .update({
      assigned_to: targetId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) return { error: error.message };

  await logAdminAudit({
    actorId: access.userId,
    actorEmail: access.email,
    action: "support_assign",
    details: { conversationId, assigneeId: targetId },
  });

  revalidateSupport();
  return { success: "Conversation assigned." };
}

export async function addSupportInternalNoteAction(
  conversationId: string,
  body: string,
): Promise<SupportActionState> {
  const access = await requireStaff();
  if ("error" in access) return access;

  const trimmed = body.trim();
  if (!trimmed) return { error: "Note cannot be empty." };

  const supabase = await db();
  const { error } = await supabase.from("support_internal_notes").insert({
    conversation_id: conversationId,
    author_id: access.userId,
    body: trimmed,
  });

  if (error) return { error: error.message };

  revalidateSupport();
  return { success: "Internal note added." };
}

export async function toggleSupportPriorityAction(
  conversationId: string,
  isPriority: boolean,
): Promise<SupportActionState> {
  const access = await requireStaff();
  if ("error" in access) return access;

  const supabase = await db();
  const { error } = await supabase
    .from("support_conversations")
    .update({ is_priority: isPriority, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) return { error: error.message };
  revalidateSupport();
  return { success: isPriority ? "Marked as priority." : "Priority removed." };
}

export async function toggleSupportPinAction(
  conversationId: string,
  isPinned: boolean,
): Promise<SupportActionState> {
  const access = await requireStaff();
  if ("error" in access) return access;

  const supabase = await db();
  const { error } = await supabase
    .from("support_conversations")
    .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) return { error: error.message };
  revalidateSupport();
  return { success: isPinned ? "Conversation pinned." : "Conversation unpinned." };
}

export async function updateSupportStatusAction(
  conversationId: string,
  status: SupportConversationStatus,
): Promise<SupportActionState> {
  const access = await requireStaff();
  if ("error" in access) return access;

  const supabase = await db();
  const conversation = await getSupportConversationById(conversationId, access.userId, true);
  if (!conversation) return { error: "Conversation not found." };

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    status,
    updated_at: now,
    status_history: appendStatusHistory(
      conversation.status_history,
      status,
      access.userId,
      "Status changed by staff",
    ),
  };

  if (status === "closed") updates.closed_at = now;
  if (status !== "closed") updates.closed_at = null;

  const { error } = await supabase
    .from("support_conversations")
    .update(updates)
    .eq("id", conversationId);

  if (error) return { error: error.message };
  revalidateSupport();
  return { success: "Status updated." };
}

export async function restoreArchivedTranscriptAction(
  transcriptId: string,
): Promise<SupportActionState> {
  const access = await requireStaff();
  if ("error" in access) return access;

  const { getArchivedTranscriptById } = await import("@/lib/data/support");
  const archive = await getArchivedTranscriptById(transcriptId);
  if (!archive) return { error: "Transcript not found." };
  if (archive.restored_conversation_id) {
    return {
      success: "Already restored.",
      conversationId: archive.restored_conversation_id,
    };
  }
  if (!archive.user_id) return { error: "Cannot restore — customer account missing." };

  const supabase = await db();
  const now = new Date().toISOString();
  const statusHistory = appendStatusHistory(
    archive.status_history,
    "waiting_on_staff",
    access.userId,
    "Restored from archive",
  );

  const { data: conversation, error: convError } = await supabase
    .from("support_conversations")
    .insert({
      user_id: archive.user_id,
      subject: archive.subject,
      status: "waiting_on_staff",
      category: archive.category,
      ai_escalated: archive.ai_escalated,
      assigned_to: archive.assigned_staff_id,
      last_message_at: now,
      last_message_preview: "Restored from archive",
      status_history: statusHistory,
      updated_at: now,
    })
    .select("id")
    .single();

  if (convError || !conversation) {
    return { error: convError?.message ?? "Could not restore ticket." };
  }

  for (const msg of archive.transcript.messages) {
    await supabase.from("support_messages").insert({
      conversation_id: conversation.id,
      author_id: msg.author_id,
      body: msg.body,
      is_staff: msg.is_staff,
      created_at: msg.created_at,
    });
  }

  for (const note of archive.transcript.internal_notes) {
    const noteAuthor = archive.assigned_staff_id ?? access.userId;
    await supabase.from("support_internal_notes").insert({
      conversation_id: conversation.id,
      author_id: noteAuthor,
      body: `[Restored] ${note.body}`,
      created_at: note.created_at,
    });
  }

  await supabase
    .from("support_archived_transcripts")
    .update({ restored_conversation_id: conversation.id })
    .eq("id", transcriptId);

  revalidateSupport();
  return { success: "Ticket restored.", conversationId: conversation.id };
}

export async function markSupportMessagesReadAction(
  conversationId: string,
  asStaff = false,
): Promise<SupportActionState> {
  const supabase = await db();
  let userId: string;
  let isStaff = asStaff;

  if (asStaff) {
    const access = await requireStaff();
    if ("error" in access) return access;
    userId = access.userId;
  } else {
    const user = await requireUser();
    if ("error" in user) return user;
    userId = user.userId;
  }

  const conversation = await getSupportConversationById(conversationId, userId, isStaff);
  if (!conversation) return { error: "Conversation not found." };

  const messages = await getSupportMessages(conversationId);
  const unreadIds = messages
    .filter((message) => {
      if (isStaff) return !message.is_staff && !message.read_at;
      return message.is_staff && !message.read_at;
    })
    .map((message) => message.id);

  if (unreadIds.length === 0) return { success: "Already read." };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("support_messages")
    .update({ read_at: now })
    .in("id", unreadIds);

  if (error) return { error: error.message };
  revalidateSupport();
  return { success: "Marked as read." };
}

export async function uploadSupportAttachmentAction(
  conversationId: string,
  messageId: string,
  formData: FormData,
  asStaff = false,
): Promise<SupportActionState> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file provided." };
  if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
    return { error: "File type not supported." };
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return { error: "File must be 10 MB or smaller." };
  }

  const supabase = await db();
  let userId: string;
  let isStaff = asStaff;

  if (asStaff) {
    const access = await requireStaff();
    if ("error" in access) return access;
    userId = access.userId;
  } else {
    const user = await requireUser();
    if ("error" in user) return user;
    userId = user.userId;
  }

  const conversation = await getSupportConversationById(conversationId, userId, isStaff);
  if (!conversation) return { error: "Conversation not found." };

  const extension =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "bin";
  const path = `${userId}/${conversationId}/${messageId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("support-attachments")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("support_attachments").insert({
    message_id: messageId,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  });

  if (insertError) return { error: insertError.message };

  revalidateSupport();
  return { success: "Attachment uploaded." };
}

export async function fetchSupportConversationAction(input: {
  conversationId: string;
  asStaff?: boolean;
}): Promise<SupportConversationDetailResult> {
  const asStaff = Boolean(input.asStaff);
  let userId: string;
  let isStaff = asStaff;

  if (asStaff) {
    const access = await requireStaff();
    if ("error" in access) return access;
    userId = access.userId;
  } else {
    const user = await requireUser();
    if ("error" in user) return user;
    userId = user.userId;
  }

  const conversation = await getSupportConversationById(
    input.conversationId,
    userId,
    isStaff,
  );
  if (!conversation) return { error: "Conversation not found." };

  const messages = await getSupportMessages(input.conversationId);
  const messagesWithUrls = await Promise.all(
    messages.map(async (message) => ({
      ...message,
      attachments: message.attachments
        ? await signSupportAttachmentUrls(message.attachments)
        : [],
    })),
  );

  return { conversation, messages: messagesWithUrls };
}

export async function fetchUserSupportInboxAction(
  search?: string,
): Promise<UserSupportInboxResult> {
  const user = await requireUser();
  if ("error" in user) return user;

  const conversations = await listUserSupportConversations(user.userId, search);
  return { conversations, userId: user.userId };
}

export async function openSupportConversationAsStaffAction(
  conversationId: string,
): Promise<SupportConversationDetailResult> {
  const access = await requireStaff();
  if ("error" in access) return access;

  const supabase = await db();
  const conversation = await getSupportConversationById(
    conversationId,
    access.userId,
    true,
  );
  if (!conversation) return { error: "Conversation not found." };

  if (!conversation.assigned_to) {
    await supabase
      .from("support_conversations")
      .update({ assigned_to: access.userId, updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }

  return fetchSupportConversationAction({ conversationId, asStaff: true });
}

export async function fetchAdminSupportInboxAction(filters?: {
  status?: string;
  assigned?: string;
  search?: string;
  priorityOnly?: boolean;
}): Promise<AdminSupportInboxResult> {
  const access = await requireStaff();
  if ("error" in access) return access;

  const { listAdminSupportConversations } = await import("@/lib/data/support");

  const conversations = await listAdminSupportConversations(access.userId, {
    status:
      filters?.status && filters.status !== "all"
        ? (filters.status as SupportConversationStatus)
        : "all",
    assigned: (filters?.assigned as "all" | "me" | "unassigned" | undefined) ?? "all",
    search: filters?.search,
    priorityOnly: filters?.priorityOnly,
  });

  return { conversations, staffUserId: access.userId };
}

export async function fetchAdminSupportUnreadAction(): Promise<
  { unreadTotal: number; waitingOnStaff: number } | SupportActionError
> {
  const access = await requireStaff();
  if ("error" in access) return access;

  const { getAdminSupportUnreadTotal, getSupportAnalytics } = await import("@/lib/data/support");
  const [unreadTotal, analytics] = await Promise.all([
    getAdminSupportUnreadTotal(access.userId),
    getSupportAnalytics(),
  ]);

  return { unreadTotal, waitingOnStaff: analytics.waitingOnStaff };
}

export async function fetchAdminSupportLatestAlertAction(): Promise<
  | {
      kind: "new_ticket" | "customer_reply";
      subject: string;
      preview: string;
      conversationId: string;
      customerName: string;
    }
  | SupportActionError
  | null
> {
  const access = await requireStaff();
  if ("error" in access) return access;

  const { listAdminSupportConversations } = await import("@/lib/data/support");
  const conversations = await listAdminSupportConversations(access.userId);
  const unread = conversations.filter((item) => (item.unread_count ?? 0) > 0);
  if (unread.length === 0) return null;

  const sorted = [...unread].sort(
    (a, b) =>
      new Date(b.last_message_at ?? 0).getTime() - new Date(a.last_message_at ?? 0).getTime(),
  );
  const top = sorted[0];
  const createdAt = new Date(top.created_at).getTime();
  const lastMessageAt = new Date(top.last_message_at ?? top.created_at).getTime();
  const isNewTicket = Math.abs(lastMessageAt - createdAt) < 60_000;

  return {
    kind: isNewTicket ? "new_ticket" : "customer_reply",
    subject: top.subject,
    preview: top.last_message_preview ?? "",
    conversationId: top.id,
    customerName:
      top.customer?.display_name?.trim() ||
      (top.customer?.username ? `@${top.customer.username}` : "Customer"),
  };
}

export async function fetchAdminSupportDetailAction(
  conversationId: string,
): Promise<AdminSupportDetailResult> {
  const access = await requireStaff();
  if ("error" in access) return access;

  const opened = await openSupportConversationAsStaffAction(conversationId);
  if ("error" in opened) return opened;

  const notes = await getSupportInternalNotes(conversationId);
  const aiMessages = opened.conversation.ai_session_id
    ? await getSupportAiMessages(opened.conversation.ai_session_id)
    : [];

  return {
    conversation: opened.conversation,
    messages: opened.messages,
    notes,
    aiMessages,
    staffUserId: access.userId,
  };
}
