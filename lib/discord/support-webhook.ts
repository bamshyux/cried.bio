import { getSiteUrl } from "@/lib/site";

export type SupportTicketDiscordAlertInput = {
  conversationId: string;
  subject: string;
  messagePreview: string;
  customerEmail: string;
  customerId: string;
  customerUsername?: string | null;
  customerDisplayName?: string | null;
};

function getSupportWebhookUrl() {
  return process.env.DISCORD_SUPPORT_WEBHOOK_URL?.trim() || "";
}

function formatCustomerLabel(input: SupportTicketDiscordAlertInput) {
  const username = input.customerUsername?.trim();
  const displayName = input.customerDisplayName?.trim();
  if (displayName && username) return `${displayName} (@${username})`;
  if (displayName) return displayName;
  if (username) return `@${username}`;
  return input.customerEmail || "Unknown customer";
}

export async function sendSupportTicketDiscordAlert(
  input: SupportTicketDiscordAlertInput,
): Promise<void> {
  const webhookUrl = getSupportWebhookUrl();
  if (!webhookUrl) return;

  const siteUrl = getSiteUrl();
  const inboxUrl = `${siteUrl}/dashboard/admin/support`;
  const customerLabel = formatCustomerLabel(input);
  const preview =
    input.messagePreview === "(attachment)"
      ? "Sent an attachment"
      : input.messagePreview.slice(0, 900);

  const embed = {
    title: "New support ticket",
    description: preview || "No message preview",
    color: 0x7c3aed,
    fields: [
      { name: "Subject", value: input.subject.slice(0, 1024), inline: false },
      { name: "Customer", value: customerLabel.slice(0, 1024), inline: true },
      {
        name: "Email",
        value: (input.customerEmail || "Unknown").slice(0, 1024),
        inline: true,
      },
      { name: "Open inbox", value: inboxUrl, inline: false },
    ],
    footer: { text: `Ticket ID: ${input.conversationId}` },
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "📩 **New support ticket** — a customer needs help.",
        embeds: [embed],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[discord] support webhook failed:", res.status, body.slice(0, 200));
    }
  } catch (error) {
    console.error(
      "[discord] support webhook error:",
      error instanceof Error ? error.message : error,
    );
  }
}
