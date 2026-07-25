"use server";

import { revalidatePath } from "next/cache";
import { generateAiSupportReply, CRIED_AI_GREETING } from "@/lib/support/ai-assistant";
import { detectSupportCategory } from "@/lib/support/knowledge-base";
import { buildTopicGreeting, getTopicByLabel } from "@/lib/support/topics";
import { createNotification } from "@/lib/data/notifications";
import { listPlatformAdminUserIds } from "@/lib/data/support";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  SupportActionState,
  SupportAiMessage,
  SupportAiSession,
  SupportCategory,
  SupportStatusHistoryEntry,
} from "@/lib/types/support";

async function db() {
  return createAdminClient() ?? (await createClient());
}

async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return { error: "You must be signed in." } as const;
  return {
    userId: data.claims.sub as string,
    email: (data.claims.email as string) ?? "",
  } as const;
}

function revalidateSupport() {
  revalidatePath("/", "layout");
  revalidatePath("/dashboard/admin/support");
}

async function loadAiMessages(sessionId: string): Promise<SupportAiMessage[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("support_ai_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  return (data ?? []) as SupportAiMessage[];
}

function detectSupportCategoryFromMessages(messages: SupportAiMessage[]): SupportCategory {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.body)
    .join(" ");
  return detectSupportCategory(userText || "other");
}

export async function startSupportAiSessionAction(
  topicLabel?: string,
): Promise<SupportActionState & { session?: SupportAiSession; greeting?: string }> {
  const user = await requireUser();
  if ("error" in user) return user;

  const topic = getTopicByLabel(topicLabel);
  const greeting = topic ? buildTopicGreeting(topic) : CRIED_AI_GREETING;

  const supabase = await db();
  const now = new Date().toISOString();

  const { data: session, error } = await supabase
    .from("support_ai_sessions")
    .insert({
      user_id: user.userId,
      status: "active",
      category: topic?.category ?? null,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !session) return { error: error?.message ?? "Could not start AI session." };

  await supabase.from("support_ai_messages").insert({
    session_id: session.id,
    role: "assistant",
    body: greeting,
  });

  return {
    success: "AI session started.",
    sessionId: session.id,
    session: session as SupportAiSession,
    greeting,
  };
}

export async function sendSupportAiMessageAction(
  sessionId: string,
  message: string,
): Promise<SupportActionState> {
  const user = await requireUser();
  if ("error" in user) return user;

  const trimmed = message.trim();
  if (!trimmed) return { error: "Message cannot be empty." };

  const supabase = await db();
  const { data: session } = await supabase
    .from("support_ai_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (!session) return { error: "AI session not found." };
  if (session.status !== "active") {
    return { error: "This AI session has ended. Start a new conversation or open your ticket." };
  }

  const now = new Date().toISOString();
  await supabase.from("support_ai_messages").insert({
    session_id: sessionId,
    role: "user",
    body: trimmed,
  });

  const history = await loadAiMessages(sessionId);
  const result = await generateAiSupportReply({ userMessage: trimmed, history });

  await supabase.from("support_ai_messages").insert({
    session_id: sessionId,
    role: "assistant",
    body: result.reply,
  });

  const messageCount = history.length + 1;
  await supabase
    .from("support_ai_sessions")
    .update({
      category: result.category,
      message_count: messageCount,
      updated_at: now,
      status: result.resolved ? "resolved" : session.status,
    })
    .eq("id", sessionId);

  if (result.shouldAutoEscalate) {
    const escalation = await escalateSessionToTicket(sessionId, user);
    if (escalation.error) {
      return {
        success: "Reply sent.",
        aiReply: result.reply,
        shouldEscalate: true,
        error: escalation.error,
        sessionId,
      };
    }

    return {
      success: escalation.success,
      aiReply: result.reply,
      conversationId: escalation.conversationId,
      messageId: escalation.messageId,
      sessionId,
    };
  }

  return {
    success: result.resolved ? "Glad we could help!" : "Reply sent.",
    aiReply: result.reply,
    shouldEscalate: result.shouldEscalate,
    sessionId,
  };
}

export async function resolveSupportAiSessionAction(sessionId: string): Promise<SupportActionState> {
  const user = await requireUser();
  if ("error" in user) return user;

  const supabase = await db();
  await supabase
    .from("support_ai_sessions")
    .update({ status: "resolved", updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", user.userId);

  return { success: "Marked as resolved. Glad we could help!" };
}

async function escalateSessionToTicket(
  sessionId: string,
  user: { userId: string; email: string },
  subject?: string,
): Promise<SupportActionState> {
  const supabase = await db();
  const { data: session } = await supabase
    .from("support_ai_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (!session) return { error: "AI session not found." };
  if (session.conversation_id) {
    return { success: "Ticket already created.", conversationId: session.conversation_id };
  }

  const aiMessages = await loadAiMessages(sessionId);
  const topic = getTopicByLabel(subject);
  const category =
    (session.category as SupportCategory) ?? topic?.category ?? detectSupportCategoryFromMessages(aiMessages);
  const ticketSubject =
    topic?.label ||
    subject?.trim() ||
    (category !== "other" ? `${category.replace(/_/g, " ")} support request` : "Support request");

  const now = new Date().toISOString();
  const statusHistory: SupportStatusHistoryEntry[] = [
    { status: "ai_assisting", changed_at: session.created_at, note: "AI session started" },
    { status: "waiting_on_staff", changed_at: now, note: "Escalated from cried AI" },
  ];

  const { data: conversation, error: convError } = await supabase
    .from("support_conversations")
    .insert({
      user_id: user.userId,
      subject: ticketSubject,
      status: "waiting_on_staff",
      category,
      ai_escalated: true,
      ai_session_id: sessionId,
      last_message_at: now,
      last_message_preview: "Escalated from cried AI",
      status_history: statusHistory,
      updated_at: now,
    })
    .select("id")
    .single();

  if (convError || !conversation) {
    return { error: convError?.message ?? "Could not create ticket." };
  }

  const initialBody =
    "Ticket opened and sent to our support team. They'll see your full cried AI conversation and follow up here shortly.";

  const { data: message } = await supabase
    .from("support_messages")
    .insert({
      conversation_id: conversation.id,
      author_id: user.userId,
      body: initialBody,
      is_staff: false,
    })
    .select("id")
    .single();

  await supabase
    .from("support_ai_sessions")
    .update({
      status: "escalated",
      conversation_id: conversation.id,
      updated_at: now,
    })
    .eq("id", sessionId);

  const adminIds = await listPlatformAdminUserIds();
  await Promise.all(
    adminIds
      .filter((id) => id !== user.userId)
      .map((adminId) =>
        createNotification({
          userId: adminId,
          type: "support_new_ticket",
          title: "AI escalated support ticket",
          body: ticketSubject,
          actorId: user.userId,
          data: { conversationId: conversation.id, aiEscalated: true },
        }),
      ),
  );

  const { sendSupportTicketDiscordAlert } = await import("@/lib/discord/support-webhook");
  await sendSupportTicketDiscordAlert({
    conversationId: conversation.id,
    subject: `[AI Escalated] ${ticketSubject}`,
    messagePreview: initialBody.slice(0, 160),
    customerEmail: user.email,
    customerId: user.userId,
  });

  revalidateSupport();
  return {
    success: "Ticket created. Our team will follow up soon.",
    conversationId: conversation.id,
    messageId: message?.id,
  };
}

export async function escalateSupportAiToTicketAction(
  sessionId: string,
  subject?: string,
): Promise<SupportActionState> {
  const user = await requireUser();
  if ("error" in user) return user;
  return escalateSessionToTicket(sessionId, user, subject);
}

export async function fetchSupportAiSessionAction(sessionId: string): Promise<
  | { error: string }
  | { session: SupportAiSession; messages: SupportAiMessage[] }
> {
  const user = await requireUser();
  if ("error" in user) return { error: user.error ?? "You must be signed in." };

  const supabase = await db();
  const { data: session } = await supabase
    .from("support_ai_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (!session) return { error: "Session not found." };
  const messages = await loadAiMessages(sessionId);
  return { session: session as SupportAiSession, messages };
}
