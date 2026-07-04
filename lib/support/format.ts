const SUPPORT_LOCALE = "en-US";

export function formatSupportTimestamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString(SUPPORT_LOCALE, { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleString(SUPPORT_LOCALE, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSupportDateSeparator(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString(SUPPORT_LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function isSameSupportDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function supportDisplayName(
  profile?: { display_name?: string; username?: string | null } | null,
) {
  if (!profile) return "User";
  return profile.display_name || (profile.username ? `@${profile.username}` : "User");
}

export function supportUnreadTotal(
  conversations: Array<{ unread_count?: number }>,
) {
  return conversations.reduce((sum, item) => sum + (item.unread_count ?? 0), 0);
}
