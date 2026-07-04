"use server";

import { revalidatePath } from "next/cache";
import { logAdminAudit } from "@/lib/admin/audit";
import { getAdminAccess, isAdminUser, type AdminAccess } from "@/lib/auth/admin-access";
import { createNotification } from "@/lib/data/notifications";
import {
  getSupportConversationById,
  getSupportMessages,
  listPlatformAdminUserIds,
  listUserSupportConversations,
  signSupportAttachmentUrls,
} from "@/lib/data/support";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminSupportDetailResult,
  AdminSupportInboxResult,
  SupportActionError,
  SupportActionState,
  SupportConversationDetailResult,
  SupportConversationStatus,
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
}

function nextStatusAfterMessage(isStaff: boolean): SupportConversationStatus {
  return isStaff ? "waiting_on_user" : "waiting_on_staff";
}

async function notifyAdminsNewTicket(conversationId: string, subject: string, customerId: string) {
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
  if (!trimmedMessage) return { error: "Message is required." };

  const supabase = await db();
  const now = new Date().toISOString();

  const { data: conversation, error: conversationError } = await supabase
    .from("support_conversations")
    .insert({
      user_id: user.userId,
      subject: trimmedSubject,
      status: "waiting_on_staff",
      last_message_at: now,
      last_message_preview: trimmedMessage.slice(0, 160),
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
      body: trimmedMessage,
      is_staff: false,
    })
    .select("id")
    .single();

  if (messageError) {
    return { error: messageError.message };
  }

  await notifyAdminsNewTicket(conversation.id, trimmedSubject, user.userId);
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

  if (isStaff && !conversation.assigned_to) {
    updates.assigned_to = authorId;
  }

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

  const { error } = await supabase
    .from("support_conversations")
    .update({ status: "closed", updated_at: new Date().toISOString() })
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

  const { error } = await supabase
    .from("support_conversations")
    .update({
      status: isStaff ? "waiting_on_user" : "waiting_on_staff",
      updated_at: new Date().toISOString(),
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

  const { listAdminSupportConversations, getSupportInternalNotes } = await import(
    "@/lib/data/support"
  );

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

export async function fetchAdminSupportDetailAction(
  conversationId: string,
): Promise<AdminSupportDetailResult> {
  const access = await requireStaff();
  if ("error" in access) return access;

  const opened = await openSupportConversationAsStaffAction(conversationId);
  if ("error" in opened) return opened;

  const { getSupportInternalNotes } = await import("@/lib/data/support");
  const notes = await getSupportInternalNotes(conversationId);

  return {
    conversation: opened.conversation,
    messages: opened.messages,
    notes,
    staffUserId: access.userId,
  };
}
