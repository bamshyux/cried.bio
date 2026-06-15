import { getSiteUrl } from "@/lib/site";

export type NewAccountAlertInput = {
  email: string;
  username?: string | null;
  displayName?: string | null;
  userId?: string;
};

function getSignupWebhookUrl() {
  return process.env.DISCORD_SIGNUP_WEBHOOK_URL?.trim() || "";
}

function formatUsername(username?: string | null) {
  const value = username?.trim();
  return value ? `@${value}` : "Not set yet";
}

export async function sendNewAccountDiscordAlert(input: NewAccountAlertInput): Promise<void> {
  const webhookUrl = getSignupWebhookUrl();
  if (!webhookUrl) return;

  const email = input.email.trim() || "Unknown";
  const username = formatUsername(input.username);
  const siteUrl = getSiteUrl();
  const profileUrl =
    input.username?.trim() ? `${siteUrl}/${encodeURIComponent(input.username.trim())}` : null;

  const embed = {
    title: "New cried.bio account",
    color: 0x5865f2,
    fields: [
      { name: "Email", value: email.slice(0, 1024), inline: true },
      { name: "Username", value: username.slice(0, 1024), inline: true },
      ...(input.displayName?.trim()
        ? [{ name: "Display name", value: input.displayName.trim().slice(0, 1024), inline: true }]
        : []),
      ...(profileUrl ? [{ name: "Profile", value: profileUrl, inline: false }] : []),
    ],
    footer: input.userId ? { text: `User ID: ${input.userId}` } : undefined,
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[discord] signup webhook failed:", res.status, body.slice(0, 200));
    }
  } catch (error) {
    console.error(
      "[discord] signup webhook error:",
      error instanceof Error ? error.message : error,
    );
  }
}
