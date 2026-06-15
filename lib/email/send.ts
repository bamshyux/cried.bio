import { getSiteUrl } from "@/lib/site";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_FROM } from "@/lib/email/constants";
import { emailButton, escapeHtml, renderEmailLayout } from "@/lib/email/layout";

export type EmailSendResult = { ok: true; id?: string } | { ok: false; error: string };

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailSendResult> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "Email service is not configured." };
  }

  try {
    const { data, error } = await client.emails.send({
      from: EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      console.error("[email] send failed:", error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email.";
    console.error("[email] send failed:", message);
    return { ok: false, error: message };
  }
}

export async function sendWelcomeEmail(input: {
  to: string;
  displayName?: string | null;
  username?: string | null;
}): Promise<EmailSendResult> {
  const siteUrl = getSiteUrl();
  const dashboardUrl = `${siteUrl}/dashboard`;
  const name = input.displayName || input.username || "there";
  const subject = "Welcome to cried.bio";

  const html = renderEmailLayout({
    preheader: "Your cried.bio profile is ready.",
    bodyHtml: `
      <h1 style="margin:0 0 12px;font-size:22px;color:#ffffff;">Welcome, ${escapeHtml(name)}!</h1>
      <p style="margin:0;color:#a3a3a3;">Thanks for joining cried.bio. Your profile is ready — customize your page, add links, and share it with the world.</p>
      ${emailButton(dashboardUrl, "Go to dashboard")}
    `,
  });

  const text = `Welcome to cried.bio, ${name}!\n\nYour profile is ready. Open your dashboard: ${dashboardUrl}`;

  return sendEmail({ to: input.to, subject, html, text });
}

export async function sendNotificationEmail(input: {
  to: string;
  title: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
}): Promise<EmailSendResult> {
  const siteUrl = getSiteUrl();
  const notificationsUrl = `${siteUrl}/dashboard/notifications`;
  const ctaUrl = input.ctaUrl ?? notificationsUrl;
  const ctaLabel = input.ctaLabel ?? "View notifications";

  const html = renderEmailLayout({
    preheader: input.title,
    bodyHtml: `
      <h1 style="margin:0 0 12px;font-size:20px;color:#ffffff;">${escapeHtml(input.title)}</h1>
      <p style="margin:0;color:#a3a3a3;">${escapeHtml(input.body)}</p>
      ${emailButton(ctaUrl, ctaLabel)}
    `,
  });

  const text = `${input.title}\n\n${input.body}\n\n${ctaUrl}`;

  return sendEmail({ to: input.to, subject: input.title, html, text });
}

export async function sendGuestbookNotificationEmail(input: {
  to: string;
  ownerName?: string | null;
  authorName: string;
  messagePreview: string;
  profileUrl?: string;
}): Promise<EmailSendResult> {
  const siteUrl = getSiteUrl();
  const guestbookUrl = input.profileUrl ?? `${siteUrl}/dashboard/guestbook`;
  const owner = input.ownerName || "there";
  const subject = `${input.authorName} signed your guestbook`;

  const html = renderEmailLayout({
    preheader: `${input.authorName} left a message on your guestbook.`,
    bodyHtml: `
      <h1 style="margin:0 0 12px;font-size:20px;color:#ffffff;">New guestbook message</h1>
      <p style="margin:0 0 12px;color:#a3a3a3;">Hi ${escapeHtml(owner)}, <strong style="color:#ffffff;">${escapeHtml(input.authorName)}</strong> signed your guestbook:</p>
      <blockquote style="margin:0;padding:12px 16px;border-left:3px solid #fafafa;background:#0a0a0a;border-radius:0 8px 8px 0;color:#d4d4d4;">${escapeHtml(input.messagePreview)}</blockquote>
      ${emailButton(guestbookUrl, "View guestbook")}
    `,
  });

  const text = `${input.authorName} signed your guestbook:\n\n"${input.messagePreview}"\n\nView guestbook: ${guestbookUrl}`;

  return sendEmail({ to: input.to, subject, html, text });
}

export async function sendBadgeNotificationEmail(input: {
  to: string;
  badgeName: string;
  badgeDescription?: string | null;
  profileUrl?: string;
}): Promise<EmailSendResult> {
  const siteUrl = getSiteUrl();
  const badgesUrl = input.profileUrl ?? `${siteUrl}/dashboard/badges`;
  const subject = `You earned the ${input.badgeName} badge`;

  const description = input.badgeDescription
    ? `<p style="margin:12px 0 0;color:#a3a3a3;">${escapeHtml(input.badgeDescription)}</p>`
    : "";

  const html = renderEmailLayout({
    preheader: `You unlocked the ${input.badgeName} badge.`,
    bodyHtml: `
      <h1 style="margin:0 0 12px;font-size:20px;color:#ffffff;">Badge unlocked</h1>
      <p style="margin:0;color:#a3a3a3;">Congratulations! You earned the <strong style="color:#fafafa;">${escapeHtml(input.badgeName)}</strong> badge.</p>
      ${description}
      ${emailButton(badgesUrl, "View your badges")}
    `,
  });

  const text = `You earned the ${input.badgeName} badge.\n\n${input.badgeDescription ?? ""}\n\nView badges: ${badgesUrl}`;

  return sendEmail({ to: input.to, subject, html, text });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}): Promise<EmailSendResult> {
  const subject = "Reset your cried.bio password";

  const html = renderEmailLayout({
    preheader: "Use this link to reset your cried.bio password.",
    bodyHtml: `
      <h1 style="margin:0 0 12px;font-size:20px;color:#ffffff;">Reset your password</h1>
      <p style="margin:0;color:#a3a3a3;">We received a request to reset your cried.bio password. Click the button below to choose a new one. This link expires soon.</p>
      ${emailButton(input.resetUrl, "Reset password")}
      <p style="margin:20px 0 0;font-size:13px;color:#737373;">If you did not request this, you can safely ignore this email.</p>
    `,
  });

  const text = `Reset your cried.bio password:\n\n${input.resetUrl}\n\nIf you did not request this, ignore this email.`;

  return sendEmail({ to: input.to, subject, html, text });
}
