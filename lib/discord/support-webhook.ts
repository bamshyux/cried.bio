import { getAdminAccess } from "@/lib/auth/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatSupportReferenceId } from "@/lib/support/reference-id";
import { getSiteUrl } from "@/lib/site";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_LABELS,
  normalizeSupportStatus,
  type SupportCategory,
  type SupportConversationStatus,
} from "@/lib/types/support";

const EMBED_COLOR = 0x7c3aed;
const MAX_FIRST_MESSAGE = 1000;
const WEBHOOK_RETRIES = 3;

type DiscordEmbedField = { name: string; value: string; inline?: boolean };
type DiscordEmbed = {
  title: string;
  color: number;
  fields: DiscordEmbedField[];
  footer: { text: string };
  timestamp: string;
};

type TicketDiscordContext = {
  conversationId: string;
  referenceId: string;
  subject: string;
  status: SupportConversationStatus;
  category: string;
  priority: string;
  isPriority: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  assignedStaff: string;
  customerUsername: string;
  customerDisplayName: string;
  customerId: string;
  customerEmail: string;
  firstMessage: string;
  messageCount: number;
  discordMessageId: string | null;
  closedBy: string | null;
  resolutionTime: string | null;
  inboxUrl: string;
  transcriptUrl: string;
};

function getSupportWebhookUrl(): string {
  return (
    process.env.DISCORD_SUPPORT_WEBHOOK?.trim() ||
    process.env.DISCORD_SUPPORT_WEBHOOK_URL?.trim() ||
    ""
  );
}

function parseWebhookUrl(webhookUrl: string): { id: string; token: string } | null {
  try {
    const url = new URL(webhookUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const webhooksIndex = parts.indexOf("webhooks");
    if (webhooksIndex === -1 || parts.length < webhooksIndex + 3) return null;
    const id = parts[webhooksIndex + 1];
    const token = parts[webhooksIndex + 2];
    if (!id || !token) return null;
    return { id, token };
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWebhookWithRetry(
  url: string,
  init: RequestInit,
): Promise<Response | null> {
  let lastError: unknown;

  for (let attempt = 0; attempt < WEBHOOK_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response;

      const retryable = response.status >= 500 || response.status === 429;
      const body = await response.text().catch(() => "");
      console.error(
        `[discord] support webhook failed (${response.status}, attempt ${attempt + 1}/${WEBHOOK_RETRIES}):`,
        body.slice(0, 300),
      );

      if (!retryable || attempt === WEBHOOK_RETRIES - 1) return response;
    } catch (error) {
      lastError = error;
      console.error(
        `[discord] support webhook error (attempt ${attempt + 1}/${WEBHOOK_RETRIES}):`,
        error instanceof Error ? error.message : error,
      );
      if (attempt === WEBHOOK_RETRIES - 1) return null;
    }

    await sleep(400 * (attempt + 1));
  }

  if (lastError) {
    console.error("[discord] support webhook exhausted retries:", lastError);
  }
  return null;
}

function truncateField(value: string, max = 1024): string {
  const trimmed = value.trim() || "—";
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

function formatPriority(isPriority: boolean): string {
  return isPriority ? "High" : "Normal";
}

function formatCategory(category: string | null | undefined): string {
  if (!category) return "Other";
  const key = category as SupportCategory;
  return SUPPORT_CATEGORY_LABELS[key] ?? category.replace(/_/g, " ");
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }) + " UTC";
  } catch {
    return iso;
  }
}

function formatResolutionTime(createdAt: string, closedAt: string | null): string | null {
  if (!closedAt) return null;
  const ms = new Date(closedAt).getTime() - new Date(createdAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

function formatFirstMessage(body: string): string {
  const normalized =
    body === "(attachment)" ? "Sent an attachment" : body.trim() || "No message content";
  return normalized.length <= MAX_FIRST_MESSAGE
    ? normalized
    : `${normalized.slice(0, MAX_FIRST_MESSAGE - 1)}…`;
}

function buildOpenEmbed(ctx: TicketDiscordContext): DiscordEmbed {
  return {
    title: "🎫 New Support Ticket",
    color: EMBED_COLOR,
    fields: [
      { name: "Reference ID", value: ctx.referenceId, inline: true },
      { name: "Username", value: truncateField(ctx.customerUsername, 256), inline: true },
      { name: "Display Name", value: truncateField(ctx.customerDisplayName, 256), inline: true },
      { name: "User ID", value: ctx.customerId, inline: false },
      { name: "Email", value: truncateField(ctx.customerEmail, 256), inline: true },
      { name: "Category", value: ctx.category, inline: true },
      { name: "Priority", value: ctx.priority, inline: true },
      { name: "Created At", value: formatTimestamp(ctx.createdAt), inline: true },
      { name: "Current Status", value: SUPPORT_STATUS_LABELS[ctx.status], inline: true },
      { name: "First Message", value: truncateField(ctx.firstMessage), inline: false },
    ],
    footer: { text: "cried.bio Support" },
    timestamp: new Date().toISOString(),
  };
}

function buildUpdatedEmbed(ctx: TicketDiscordContext): DiscordEmbed {
  return {
    title: "🎫 Support Ticket",
    color: EMBED_COLOR,
    fields: [
      { name: "Reference ID", value: ctx.referenceId, inline: true },
      { name: "Username", value: truncateField(ctx.customerUsername, 256), inline: true },
      { name: "Display Name", value: truncateField(ctx.customerDisplayName, 256), inline: true },
      { name: "User ID", value: ctx.customerId, inline: false },
      { name: "Email", value: truncateField(ctx.customerEmail, 256), inline: true },
      { name: "Category", value: ctx.category, inline: true },
      { name: "Priority", value: ctx.priority, inline: true },
      { name: "Created At", value: formatTimestamp(ctx.createdAt), inline: true },
      { name: "Status", value: SUPPORT_STATUS_LABELS[ctx.status], inline: true },
      { name: "Assigned Staff", value: truncateField(ctx.assignedStaff, 256), inline: true },
      { name: "Last Updated", value: formatTimestamp(ctx.updatedAt), inline: true },
      { name: "Message Count", value: String(ctx.messageCount), inline: true },
      { name: "First Message", value: truncateField(ctx.firstMessage), inline: false },
    ],
    footer: { text: "cried.bio Support" },
    timestamp: new Date().toISOString(),
  };
}

function buildClosedEmbed(ctx: TicketDiscordContext): DiscordEmbed {
  return {
    title: "🎫 Support Ticket — Closed",
    color: EMBED_COLOR,
    fields: [
      { name: "Reference ID", value: ctx.referenceId, inline: true },
      { name: "Username", value: truncateField(ctx.customerUsername, 256), inline: true },
      { name: "Display Name", value: truncateField(ctx.customerDisplayName, 256), inline: true },
      { name: "User ID", value: ctx.customerId, inline: false },
      { name: "Email", value: truncateField(ctx.customerEmail, 256), inline: true },
      { name: "Category", value: ctx.category, inline: true },
      { name: "Priority", value: ctx.priority, inline: true },
      { name: "Status", value: "Closed", inline: true },
      { name: "Closed By", value: truncateField(ctx.closedBy ?? "Unknown", 256), inline: true },
      { name: "Closed At", value: formatTimestamp(ctx.closedAt), inline: true },
      {
        name: "Resolution Time",
        value: ctx.resolutionTime ?? "—",
        inline: true,
      },
      { name: "Assigned Staff", value: truncateField(ctx.assignedStaff, 256), inline: true },
      { name: "Message Count", value: String(ctx.messageCount), inline: true },
      { name: "First Message", value: truncateField(ctx.firstMessage), inline: false },
    ],
    footer: { text: "cried.bio Support" },
    timestamp: new Date().toISOString(),
  };
}

async function loadTicketDiscordContext(
  conversationId: string,
  closedByUserId?: string,
): Promise<TicketDiscordContext | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: row, error } = await supabase
    .from("support_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !row) {
    console.error("[discord] load ticket context:", error?.message ?? "not found");
    return null;
  }

  const [{ data: customer }, { count: messageCount }, { data: firstMessageRow }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name")
      .eq("id", row.user_id)
      .maybeSingle(),
    supabase
      .from("support_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId),
    supabase
      .from("support_messages")
      .select("body")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  let customerEmail = "Unknown";
  const { data: authUser } = await supabase.auth.admin.getUserById(row.user_id);
  if (authUser.user?.email) customerEmail = authUser.user.email;

  let assignedStaff = "Unassigned";
  if (row.assigned_to) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", row.assigned_to)
      .maybeSingle();
    if (assignee) {
      assignedStaff =
        assignee.display_name?.trim() ||
        (assignee.username ? `@${assignee.username}` : "Staff member");
    }
  }

  let closedBy: string | null = null;
  if (closedByUserId) {
    const { data: closer } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", closedByUserId)
      .maybeSingle();
    if (closer) {
      closedBy =
        closer.display_name?.trim() ||
        (closer.username ? `@${closer.username}` : "Staff member");
    }
  }

  const siteUrl = getSiteUrl();
  const status = normalizeSupportStatus(row.status);
  const referenceId = formatSupportReferenceId(conversationId);

  return {
    conversationId,
    referenceId,
    subject: row.subject ?? "Support ticket",
    status,
    category: formatCategory(row.category),
    priority: formatPriority(Boolean(row.is_priority)),
    isPriority: Boolean(row.is_priority),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at ?? null,
    assignedStaff,
    customerUsername: customer?.username ? `@${customer.username}` : "—",
    customerDisplayName: customer?.display_name?.trim() || "—",
    customerId: row.user_id,
    customerEmail,
    firstMessage: formatFirstMessage(firstMessageRow?.body ?? ""),
    messageCount: messageCount ?? 0,
    discordMessageId: row.discord_webhook_message_id ?? null,
    closedBy,
    resolutionTime: formatResolutionTime(row.created_at, row.closed_at ?? null),
    inboxUrl: `${siteUrl}/dashboard/admin/support`,
    transcriptUrl: `${siteUrl}/api/support/transcript/${conversationId}`,
  };
}

async function postWebhookMessage(
  webhookUrl: string,
  payload: { content?: string; embeds: DiscordEmbed[] },
): Promise<string | null> {
  const url = `${webhookUrl}${webhookUrl.includes("?") ? "&" : "?"}wait=true`;
  const response = await fetchWebhookWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response?.ok) return null;

  try {
    const data = (await response.json()) as { id?: string };
    return data.id ?? null;
  } catch {
    return null;
  }
}

async function patchWebhookMessage(
  webhookUrl: string,
  messageId: string,
  payload: { embeds: DiscordEmbed[] },
): Promise<boolean> {
  const parsed = parseWebhookUrl(webhookUrl);
  if (!parsed) {
    console.error("[discord] invalid webhook URL — cannot edit message");
    return false;
  }

  const url = `https://discord.com/api/webhooks/${parsed.id}/${parsed.token}/messages/${messageId}`;
  const response = await fetchWebhookWithRetry(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return Boolean(response?.ok);
}

async function storeDiscordMessageId(conversationId: string, messageId: string) {
  const supabase = createAdminClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("support_conversations")
    .update({ discord_webhook_message_id: messageId })
    .eq("id", conversationId);

  if (error) {
    console.error("[discord] store message id failed:", error.message);
  }
}

/** Fire-and-forget wrapper — never throws. */
export function queueSupportDiscordWebhook(task: () => Promise<void>) {
  void task().catch((error) => {
    console.error(
      "[discord] support webhook task failed:",
      error instanceof Error ? error.message : error,
    );
  });
}

export async function notifySupportTicketCreated(conversationId: string): Promise<void> {
  const webhookUrl = getSupportWebhookUrl();
  if (!webhookUrl) return;

  const ctx = await loadTicketDiscordContext(conversationId);
  if (!ctx) return;

  const content = ctx.isPriority ? "@here" : undefined;
  const messageId = await postWebhookMessage(webhookUrl, {
    content,
    embeds: [buildOpenEmbed(ctx)],
  });

  if (messageId) {
    await storeDiscordMessageId(conversationId, messageId);
  }
}

export async function updateSupportTicketDiscordEmbed(conversationId: string): Promise<void> {
  const webhookUrl = getSupportWebhookUrl();
  if (!webhookUrl) return;

  const ctx = await loadTicketDiscordContext(conversationId);
  if (!ctx?.discordMessageId) {
    if (ctx && ctx.status !== "closed") {
      await notifySupportTicketCreated(conversationId);
    }
    return;
  }

  const embed =
    ctx.status === "closed" ? buildClosedEmbed(ctx) : buildUpdatedEmbed(ctx);

  const ok = await patchWebhookMessage(webhookUrl, ctx.discordMessageId, {
    embeds: [embed],
  });

  if (!ok) {
    console.error("[discord] failed to edit support ticket embed:", conversationId);
  }
}

export async function notifySupportTicketClosed(
  conversationId: string,
  closedByUserId?: string,
): Promise<void> {
  const webhookUrl = getSupportWebhookUrl();
  if (!webhookUrl) return;

  const ctx = await loadTicketDiscordContext(conversationId, closedByUserId);
  if (!ctx) return;

  if (ctx.discordMessageId) {
    await patchWebhookMessage(webhookUrl, ctx.discordMessageId, {
      embeds: [buildClosedEmbed(ctx)],
    });
  } else {
    await notifySupportTicketCreated(conversationId);
    const refreshed = await loadTicketDiscordContext(conversationId, closedByUserId);
    if (refreshed?.discordMessageId) {
      await patchWebhookMessage(webhookUrl, refreshed.discordMessageId, {
        embeds: [buildClosedEmbed(refreshed)],
      });
    }
  }

  const transcriptMessage = [
    "📄 **Support ticket closed — transcript ready**",
    `Reference: **${ctx.referenceId}**`,
    `Download: ${ctx.transcriptUrl}`,
  ].join("\n");

  await postWebhookMessage(webhookUrl, {
    embeds: [
      {
        title: "📄 Ticket Transcript",
        color: EMBED_COLOR,
        description: transcriptMessage,
        fields: [
          { name: "cried Reference ID", value: ctx.referenceId, inline: true },
          { name: "Transcript URL", value: ctx.transcriptUrl, inline: false },
        ],
        footer: { text: "cried.bio Support" },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

/** @deprecated Use notifySupportTicketCreated — kept for import compatibility. */
export type SupportTicketDiscordAlertInput = {
  conversationId: string;
  subject: string;
  messagePreview: string;
  customerEmail: string;
  customerId: string;
  customerUsername?: string | null;
  customerDisplayName?: string | null;
};

export async function sendSupportTicketDiscordAlert(input: SupportTicketDiscordAlertInput) {
  await notifySupportTicketCreated(input.conversationId);
}

/** Used by transcript API route auth check re-export */
export { getAdminAccess };
