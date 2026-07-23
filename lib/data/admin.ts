import type {
  AdminAuditLog,
  AdminNotification,
  AdminUserRow,
  Announcement,
  PlatformSettings,
  PlatformStats,
  ReservedUsername,
  SecurityEvent,
  UserTimelineEvent,
} from "@/lib/types/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function db() {
  return createAdminClient() ?? (await createClient());
}

export async function getPlatformStats(): Promise<PlatformStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_platform_stats");
  if (error || !data) return null;
  return data as PlatformStats;
}

export async function listAdminUsers(query = ""): Promise<AdminUserRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_users", { p_query: query.trim() });
  if (error) return [];
  return ((data ?? []) as AdminUserRow[]).map((row) => ({
    ...row,
    badge_count: Number(row.badge_count ?? 0),
  }));
}

export async function getAdminUser(userId: string): Promise<AdminUserRow | null> {
  const supabase = await db();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, uid, username, display_name, role, is_admin, is_banned, is_disabled, premium_tier, premium_expires_at, created_at, last_login_at")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;

  const admin = createAdminClient();
  let email: string | null = null;
  if (admin) {
    const { data } = await admin.auth.admin.getUserById(userId);
    email = data.user?.email ?? null;
  }

  const { count } = await supabase
    .from("profile_badges")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", userId);

  return {
    ...(profile as Omit<AdminUserRow, "email" | "badge_count">),
    email,
    badge_count: count ?? 0,
  };
}

export async function getUserTimeline(userId: string, limit = 50): Promise<UserTimelineEvent[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("user_timeline_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as UserTimelineEvent[];
}

export async function listAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("admin_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AdminAuditLog[];
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Announcement[];
}

export async function getActiveAnnouncement(): Promise<Announcement | null> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[announcements] getActiveAnnouncement:", error.message);
    return null;
  }

  const now = Date.now();
  const active = (data as Announcement[] | null)?.find((item) => {
    const startsOk = !item.starts_at || new Date(item.starts_at).getTime() <= now;
    const endsOk = !item.ends_at || new Date(item.ends_at).getTime() >= now;
    return startsOk && endsOk;
  });

  return active ?? null;
}

export async function listNotifications(limit = 50): Promise<AdminNotification[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AdminNotification[];
}

export async function listSecurityEvents(limit = 100): Promise<SecurityEvent[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("security_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as SecurityEvent[];
}

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  const supabase = await db();
  const { data } = await supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle();
  if (!data) return null;
  return data as PlatformSettings;
}

export async function listReservedUsernames(): Promise<ReservedUsername[]> {
  const supabase = await db();
  const { data } = await supabase.from("reserved_usernames").select("*").order("username");
  return (data ?? []) as ReservedUsername[];
}

export async function getAdminAnalyticsSummary() {
  const supabase = await db();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    { count: totalUsers },
    { data: recentUsers },
    { data: views },
    { data: guestbook },
    { data: signups },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("created_at").gte("created_at", since.toISOString()),
    supabase
      .from("analytics_events")
      .select("created_at, event_type")
      .gte("created_at", since.toISOString()),
    supabase
      .from("guestbook_entries")
      .select("created_at")
      .gte("created_at", since.toISOString()),
    supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true }),
  ]);

  const dailySignups = bucketByDay(signups ?? [], 30);
  const dailyViews = bucketByDay(
    (views ?? []).filter((v) => v.event_type === "profile_view"),
    30,
  );
  const dailyGuestbook = bucketByDay(guestbook ?? [], 30);
  const dailyClicks = bucketByDay(
    (views ?? []).filter((v) => v.event_type === "link_click"),
    30,
  );

  const { data: topProfiles } = await supabase
    .from("analytics_events")
    .select("profile_id")
    .eq("event_type", "profile_view")
    .gte("created_at", since.toISOString());

  const viewCounts = new Map<string, number>();
  for (const row of topProfiles ?? []) {
    viewCounts.set(row.profile_id, (viewCounts.get(row.profile_id) ?? 0) + 1);
  }

  const topProfileIds = [...viewCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  let mostViewedProfiles: { username: string | null; views: number }[] = [];
  if (topProfileIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", topProfileIds);
    mostViewedProfiles = (profiles ?? []).map((p) => ({
      username: p.username,
      views: viewCounts.get(p.id) ?? 0,
    }));
    mostViewedProfiles.sort((a, b) => b.views - a.views);
  }

  const { data: layoutRows } = await supabase.from("profile_settings").select("layout");
  const layoutCounts = new Map<string, number>();
  for (const row of layoutRows ?? []) {
    layoutCounts.set(row.layout, (layoutCounts.get(row.layout) ?? 0) + 1);
  }
  const mostUsedLayouts = [...layoutCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([layout, count]) => ({ layout, count }));

  return {
    totalUsers: totalUsers ?? 0,
    dailySignups,
    dailyViews,
    dailyGuestbook,
    dailyClicks,
    mostViewedProfiles,
    mostUsedLayouts,
    recentUserCount: recentUsers?.length ?? 0,
  };
}

function bucketByDay(rows: { created_at: string }[], days: number) {
  const map = new Map<string, number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([date, count]) => ({ date, count }));
}

export async function listPremiumUsers(): Promise<AdminUserRow[]> {
  const users = await listAdminUsers("");
  return users.filter((u) => u.premium_tier && u.premium_tier !== "free");
}
