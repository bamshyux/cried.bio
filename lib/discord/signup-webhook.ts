import { formatCountry } from "@/lib/analytics/geo";
import { getSiteUrl } from "@/lib/site";
import { normalizePlanTier } from "@/lib/premium/plans";
import { resolvePremiumActiveState } from "@/lib/premium/subscription-status";
import { createAdminClient } from "@/lib/supabase/admin";

const EMBED_COLOR = 0x7c3aed;
const WEBHOOK_RETRIES = 3;
const DEFAULT_LOGO_PATH = "/brand/cried-icon-180.svg";

type DiscordEmbedField = { name: string; value: string; inline?: boolean };
type DiscordEmbed = {
  title: string;
  color: number;
  thumbnail?: { url: string };
  fields: DiscordEmbedField[];
  footer: { text: string };
  timestamp: string;
};

export type NewAccountWebhookContext = {
  ipCountry?: string | null;
};

export type NewAccountAlertInput = {
  email: string;
  username?: string | null;
  displayName?: string | null;
  userId?: string;
};

function getCreatedAccountsWebhookUrl(): string {
  return (
    process.env.DISCORD_CREATED_ACCOUNTS_WEBHOOK?.trim() ||
    process.env.DISCORD_SIGNUP_WEBHOOK_URL?.trim() ||
    ""
  );
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
        `[discord] created-account webhook failed (${response.status}, attempt ${attempt + 1}/${WEBHOOK_RETRIES}):`,
        body.slice(0, 300),
      );

      if (!retryable || attempt === WEBHOOK_RETRIES - 1) return response;
    } catch (error) {
      lastError = error;
      console.error(
        `[discord] created-account webhook error (attempt ${attempt + 1}/${WEBHOOK_RETRIES}):`,
        error instanceof Error ? error.message : error,
      );
      if (attempt === WEBHOOK_RETRIES - 1) return null;
    }

    await sleep(400 * (attempt + 1));
  }

  if (lastError) {
    console.error("[discord] created-account webhook exhausted retries:", lastError);
  }
  return null;
}

function truncateField(value: string, max = 1024): string {
  const trimmed = value.trim() || "—";
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
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

function formatSignupMethod(provider: string | null | undefined, identities: string[]): string {
  const primary = (provider ?? identities[0] ?? "email").toLowerCase();
  switch (primary) {
    case "email":
      return "Email";
    case "google":
      return "Google";
    case "discord":
      return "Discord";
    case "github":
      return "GitHub";
    case "apple":
      return "Apple";
    case "twitter":
    case "x":
      return "X";
    default:
      return primary.charAt(0).toUpperCase() + primary.slice(1);
  }
}

function formatPremiumLabel(
  tier: string | null | undefined,
  expiresAt: string | null | undefined,
): string {
  const normalized = normalizePlanTier(tier);
  const { active } = resolvePremiumActiveState({
    premium_tier: normalized,
    premium_expires_at: expiresAt ?? null,
    lifetime: false,
  });
  if (!active || normalized === "free") return "Free";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function resolveThumbnail(avatarUrl: string | null | undefined, siteUrl: string): string {
  const avatar = avatarUrl?.trim();
  if (avatar) return avatar;
  return `${siteUrl}${DEFAULT_LOGO_PATH}`;
}

function buildNewAccountEmbed(input: {
  username: string;
  displayName: string;
  userId: string;
  email: string;
  accountCreated: string;
  signupMethod: string;
  emailVerified: boolean;
  premiumStatus: string;
  ipCountry: string | null;
  referralCode: string | null;
  thumbnailUrl: string;
}): DiscordEmbed {
  const fields: DiscordEmbedField[] = [
    { name: "Username", value: truncateField(input.username, 256), inline: true },
    { name: "Display Name", value: truncateField(input.displayName, 256), inline: true },
    { name: "User ID", value: input.userId, inline: false },
    { name: "Email", value: truncateField(input.email, 256), inline: true },
    { name: "Account Created", value: formatTimestamp(input.accountCreated), inline: true },
    { name: "Signup Method", value: input.signupMethod, inline: true },
    { name: "Email Verified", value: input.emailVerified ? "Yes" : "No", inline: true },
    { name: "Premium Status", value: input.premiumStatus, inline: true },
  ];

  if (input.ipCountry) {
    fields.push({
      name: "IP Country",
      value: truncateField(formatCountry(input.ipCountry), 256),
      inline: true,
    });
  }

  if (input.referralCode) {
    fields.push({
      name: "Referral Code",
      value: truncateField(input.referralCode, 256),
      inline: true,
    });
  }

  return {
    title: "🎉 New Account Created",
    color: EMBED_COLOR,
    thumbnail: { url: input.thumbnailUrl },
    fields,
    footer: { text: "cried.bio" },
    timestamp: new Date().toISOString(),
  };
}

async function markWebhookSent(userId: string) {
  const admin = createAdminClient();
  if (!admin) return;

  const { error } = await admin
    .from("profiles")
    .update({ discord_created_webhook_sent_at: new Date().toISOString() })
    .eq("id", userId)
    .is("discord_created_webhook_sent_at", null);

  if (error) {
    console.error("[discord] mark created-account webhook sent failed:", error.message);
  }
}

async function hasWebhookBeenSent(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const { data, error } = await admin
    .from("profiles")
    .select("discord_created_webhook_sent_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[discord] check created-account webhook status failed:", error.message);
    return false;
  }

  return Boolean(data?.discord_created_webhook_sent_at);
}

/** Fire-and-forget wrapper — never throws. */
export function queueNewAccountDiscordWebhook(
  userId: string,
  context?: NewAccountWebhookContext,
) {
  void notifyNewAccountCreated(userId, context).catch((error) => {
    console.error(
      "[discord] created-account webhook task failed:",
      error instanceof Error ? error.message : error,
    );
  });
}

export async function notifyNewAccountCreated(
  userId: string,
  context?: NewAccountWebhookContext,
): Promise<void> {
  const webhookUrl = getCreatedAccountsWebhookUrl();
  if (!webhookUrl) return;

  if (await hasWebhookBeenSent(userId)) return;

  const admin = createAdminClient();
  if (!admin) return;

  const [{ data: profile }, authResult] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "username, display_name, avatar_url, created_at, premium_tier, premium_expires_at, discord_created_webhook_sent_at",
      )
      .eq("id", userId)
      .maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ]);

  if (profile?.discord_created_webhook_sent_at) return;

  const authUser = authResult.data.user;
  if (!authUser) {
    console.error("[discord] created-account webhook: auth user not found:", userId);
    return;
  }

  const identities = authUser.identities?.map((identity) => identity.provider) ?? [];
  const provider =
    (authUser.app_metadata?.provider as string | undefined) ??
    (authUser.app_metadata?.providers as string[] | undefined)?.[0] ??
    null;

  const siteUrl = getSiteUrl();
  const username = profile?.username?.trim()
    ? `@${profile.username.trim()}`
    : "Not set yet";
  const displayName = profile?.display_name?.trim() || "Not set";

  const embed = buildNewAccountEmbed({
    username,
    displayName,
    userId,
    email: authUser.email ?? "Unknown",
    accountCreated: profile?.created_at ?? authUser.created_at,
    signupMethod: formatSignupMethod(provider, identities),
    emailVerified: Boolean(authUser.email_confirmed_at),
    premiumStatus: formatPremiumLabel(profile?.premium_tier, profile?.premium_expires_at),
    ipCountry: context?.ipCountry?.trim() || null,
    referralCode: null,
    thumbnailUrl: resolveThumbnail(profile?.avatar_url, siteUrl),
  });

  const response = await fetchWebhookWithRetry(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (response?.ok) {
    await markWebhookSent(userId);
  }
}

/** @deprecated Use notifyNewAccountCreated — kept for import compatibility. */
export async function sendNewAccountDiscordAlert(input: NewAccountAlertInput): Promise<void> {
  if (!input.userId) return;
  await notifyNewAccountCreated(input.userId);
}
