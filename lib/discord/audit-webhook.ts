import { formatCountry } from "@/lib/analytics/geo";
import { formatSupportReferenceId } from "@/lib/support/reference-id";
import { createAdminClient } from "@/lib/supabase/admin";

const EMBED_COLOR = 0x7c3aed;
const WEBHOOK_RETRIES = 3;

type DiscordEmbedField = { name: string; value: string; inline?: boolean };
type DiscordEmbed = {
  title: string;
  color: number;
  description: string;
  fields: DiscordEmbedField[];
  footer: { text: string };
  timestamp: string;
};

export type AuditLogInput = {
  action: string;
  description: string;
  username?: string | null;
  userId?: string | null;
  displayName?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  country?: string | null;
  referenceId?: string | null;
  timestamp?: string | null;
};

const ACTION_LABELS: Record<string, string> = {
  user_updated: "User Updated",
  uid_changed: "UID Changed",
  premium_granted: "Premium Granted",
  premium_revoked: "Premium Revoked",
  announcement_created: "Announcement Created",
  announcement_activated: "Announcement Activated",
  announcement_deactivated: "Announcement Deactivated",
  platform_settings_updated: "Platform Settings Updated",
  badge_updated: "Badge Updated",
  badge_deleted: "Badge Deleted",
  force_logout_all_requested: "Force Logout All",
  views_granted: "Views Granted",
  support_reply: "Support Reply",
  support_delete: "Support Ticket Deleted",
  support_assign: "Support Ticket Assigned",
  platform_update_created: "Platform Update Created",
  platform_update_deleted: "Platform Update Deleted",
  platform_updates_cleared: "Platform Updates Cleared",
  store_product_created: "Store Product Created",
  store_product_updated: "Store Product Updated",
  store_product_archived: "Store Product Archived",
  owner_crown_drop: "Owner Crown Drop",
  owner_badge_drop: "Owner Badge Drop",
  owner_hype_ping: "Owner Hype Ping",
  owner_spotlight: "Owner Spotlight",
  owner_flex_banner: "Owner Flex Banner",
  owner_cache_nuke: "Owner Cache Nuke",
  owner_shockwave: "Owner Shockwave",
  owner_sleep_on: "Owner Sleep Mode On",
  owner_sleep_off: "Owner Sleep Mode Off",
  owner_premium_revoke: "Owner Premium Revoke",
  moderation_word_added: "Moderation Word Added",
  moderation_word_removed: "Moderation Word Removed",
  moderation_category_toggled: "Moderation Category Toggled",
  add_word: "Moderation Word Added",
  remove_word: "Moderation Word Removed",
  enable_category: "Moderation Category Enabled",
  disable_category: "Moderation Category Disabled",
};

function getAuditWebhookUrl(): string {
  return process.env.DISCORD_AUDIT_WEBHOOK?.trim() || "";
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
        `[discord] audit webhook failed (${response.status}, attempt ${attempt + 1}/${WEBHOOK_RETRIES}):`,
        body.slice(0, 300),
      );

      if (!retryable || attempt === WEBHOOK_RETRIES - 1) return response;
    } catch (error) {
      lastError = error;
      console.error(
        `[discord] audit webhook error (attempt ${attempt + 1}/${WEBHOOK_RETRIES}):`,
        error instanceof Error ? error.message : error,
      );
      if (attempt === WEBHOOK_RETRIES - 1) return null;
    }

    await sleep(400 * (attempt + 1));
  }

  if (lastError) {
    console.error("[discord] audit webhook exhausted retries:", lastError);
  }
  return null;
}

function truncateField(value: string, max = 1024): string {
  const trimmed = value.trim() || "—";
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

function formatUsername(username?: string | null): string | null {
  if (!username?.trim()) return null;
  const value = username.trim().replace(/^@+/, "");
  return value ? `@${value}` : null;
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return (
      new Date(iso).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }) + " UTC"
    );
  } catch {
    return iso;
  }
}

export function humanizeAuditAction(action: string): string {
  const normalized = action.trim();
  if (!normalized) return "Unknown Action";
  return (
    ACTION_LABELS[normalized] ??
    normalized
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function extractReferenceId(details?: Record<string, unknown>): string | null {
  if (!details) return null;

  if (typeof details.referenceId === "string" && details.referenceId.trim()) {
    return details.referenceId.trim();
  }

  if (typeof details.conversationId === "string" && details.conversationId.trim()) {
    return formatSupportReferenceId(details.conversationId);
  }

  if (typeof details.purchaseId === "string" && details.purchaseId.trim()) {
    return details.purchaseId.trim();
  }

  if (typeof details.badgeId === "string" && details.badgeId.trim()) {
    return details.badgeId.trim();
  }

  if (typeof details.productId === "string" && details.productId.trim()) {
    return details.productId.trim();
  }

  if (typeof details.id === "string" && details.id.trim()) {
    return details.id.trim();
  }

  return null;
}

export function adminAuditToDiscordInput(input: {
  actorId: string;
  actorEmail: string;
  action: string;
  targetUserId?: string | null;
  details?: Record<string, unknown>;
}): AuditLogInput {
  const details = input.details ?? {};
  const action = humanizeAuditAction(input.action);
  let description = `${action}.`;

  if (typeof details.subject === "string" && details.subject.trim()) {
    description = `${action}: ${details.subject.trim()}.`;
  } else if (typeof details.title === "string" && details.title.trim()) {
    description = `${action}: ${details.title.trim()}.`;
  } else if (typeof details.username === "string" && details.username.trim()) {
    description = `${action} for @${details.username.trim().replace(/^@+/, "")}.`;
  } else if (typeof details.slug === "string" && details.slug.trim()) {
    description = `${action}: ${details.slug.trim()}.`;
  } else if (typeof details.preset === "string" && details.preset.trim()) {
    description = `${action}: ${details.preset.trim()}.`;
  } else if (typeof details.message === "string" && details.message.trim()) {
    description = `${action}: ${details.message.trim().slice(0, 160)}.`;
  } else if (typeof details.conversationId === "string") {
    description = `${action} on support ticket ${formatSupportReferenceId(details.conversationId)}.`;
  } else if (input.targetUserId) {
    description = `${action} on a user account.`;
  }

  return {
    action,
    description,
    userId: input.actorId,
    email: input.actorEmail,
    username:
      typeof details.username === "string"
        ? formatUsername(details.username)
        : null,
    referenceId: extractReferenceId(details),
  };
}

export function moderationAuditToDiscordInput(input: {
  adminUserId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
}): AuditLogInput {
  const action = humanizeAuditAction(input.action);
  const target = input.targetType.replace(/_/g, " ");
  const detailWord =
    typeof input.details?.word === "string" ? `: "${input.details.word}"` : "";

  return {
    action,
    description: `${action} on ${target}${detailWord}.`,
    userId: input.adminUserId,
    email: input.adminEmail,
    referenceId: input.targetId ?? null,
  };
}

async function enrichAuditLogInput(input: AuditLogInput): Promise<AuditLogInput> {
  const enriched: AuditLogInput = {
    ...input,
    username: formatUsername(input.username) ?? input.username ?? null,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };

  if (!enriched.ipAddress || !enriched.country) {
    try {
      const { getRequestMeta } = await import("@/lib/data/account-settings");
      const meta = await getRequestMeta();
      enriched.ipAddress = enriched.ipAddress ?? meta.ip_address ?? null;

      if (!enriched.country) {
        const { resolveCountry } = await import("@/lib/analytics/geo");
        const { headers } = await import("next/headers");
        enriched.country = await resolveCountry(await headers());
      }
    } catch {
      /* request context is best-effort */
    }
  }

  if (!enriched.userId) return enriched;

  const admin = createAdminClient();
  if (!admin) return enriched;

  if (!enriched.username || !enriched.displayName) {
    const { data: profile } = await admin
      .from("profiles")
      .select("username, display_name")
      .eq("id", enriched.userId)
      .maybeSingle();

    if (!enriched.username && profile?.username) {
      enriched.username = formatUsername(profile.username);
    }
    if (!enriched.displayName && profile?.display_name?.trim()) {
      enriched.displayName = profile.display_name.trim();
    }
  }

  if (!enriched.email) {
    const { data } = await admin.auth.admin.getUserById(enriched.userId);
    enriched.email = data.user?.email ?? enriched.email ?? null;
  }

  return enriched;
}

function buildAuditEmbed(input: AuditLogInput): DiscordEmbed {
  const fields: DiscordEmbedField[] = [
    { name: "Action", value: truncateField(input.action, 256), inline: true },
  ];

  if (input.username) {
    fields.push({ name: "Username", value: truncateField(input.username, 256), inline: true });
  }

  if (input.userId) {
    fields.push({ name: "User ID", value: input.userId, inline: false });
  }

  if (input.displayName) {
    fields.push({
      name: "Display Name",
      value: truncateField(input.displayName, 256),
      inline: true,
    });
  }

  if (input.email) {
    fields.push({ name: "Email", value: truncateField(input.email, 256), inline: true });
  }

  if (input.ipAddress) {
    fields.push({
      name: "IP Address",
      value: truncateField(input.ipAddress, 256),
      inline: true,
    });
  }

  if (input.country) {
    fields.push({
      name: "Country",
      value: truncateField(formatCountry(input.country), 256),
      inline: true,
    });
  }

  if (input.referenceId) {
    fields.push({
      name: "Reference ID",
      value: truncateField(input.referenceId, 256),
      inline: true,
    });
  }

  fields.push({
    name: "Timestamp",
    value: formatTimestamp(input.timestamp),
    inline: true,
  });

  return {
    title: "📝 Audit Log",
    color: EMBED_COLOR,
    description: truncateField(input.description, 4096),
    fields,
    footer: { text: "cried.bio Audit" },
    timestamp: new Date().toISOString(),
  };
}

/** Fire-and-forget wrapper — never throws. */
export function queueAuditLog(input: AuditLogInput) {
  void sendAuditLog(input).catch((error) => {
    console.error(
      "[discord] audit log task failed:",
      error instanceof Error ? error.message : error,
    );
  });
}

/** Queue an audit log and auto-enrich actor fields from a user ID. */
export function queueAuditLogForUser(
  input: Omit<AuditLogInput, "username" | "displayName" | "email" | "ipAddress" | "country"> & {
    userId: string;
    email?: string | null;
    username?: string | null;
    displayName?: string | null;
  },
) {
  queueAuditLog({
    ...input,
    email: input.email ?? undefined,
    username: input.username ?? undefined,
    displayName: input.displayName ?? undefined,
  });
}

export async function sendAuditLog(input: AuditLogInput): Promise<void> {
  const webhookUrl = getAuditWebhookUrl();
  if (!webhookUrl) return;

  const enriched = await enrichAuditLogInput(input);
  const embed = buildAuditEmbed(enriched);

  await fetchWebhookWithRetry(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });
}
