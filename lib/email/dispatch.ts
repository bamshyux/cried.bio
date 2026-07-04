import {
  sendBadgeNotificationEmail,
  sendGuestbookNotificationEmail,
  sendNotificationEmail,
} from "@/lib/email/send";
import { getUserEmailById } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/lib/types/notification";

export async function dispatchNotificationEmail(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    const to = await getUserEmailById(input.userId);
    if (!to) return;

    if (input.type === "guestbook") {
      const authorName = String(input.data?.author_name ?? "Someone");
      const messagePreview = String(input.data?.message_preview ?? input.body);
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", input.userId)
        .maybeSingle();

      await sendGuestbookNotificationEmail({
        to,
        ownerName: profile?.display_name || profile?.username,
        authorName,
        messagePreview,
      });
      return;
    }

    if (input.type === "badge_earned" || input.type === "milestone") {
      const badgeName = String(input.data?.badge_name ?? input.title.replace(/^You earned the /i, "").replace(/ badge$/i, ""));
      await sendBadgeNotificationEmail({
        to,
        badgeName,
        badgeDescription: input.body || null,
      });
      return;
    }

    const siteUrl = getSiteUrl();
    const isSupportType =
      input.type === "support_new_ticket" ||
      input.type === "support_reply" ||
      input.type === "support_closed" ||
      input.type === "support_reopened";

    await sendNotificationEmail({
      to,
      title: input.title,
      body: input.body,
      ctaUrl: isSupportType
        ? `${siteUrl}/dashboard/admin/support`
        : `${siteUrl}/dashboard/notifications`,
      ctaLabel: isSupportType ? "Open Support Inbox" : "View notifications",
    });
  } catch (error) {
    console.error("[email] notification dispatch failed:", error);
  }
}
