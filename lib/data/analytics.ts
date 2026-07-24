import { createClient } from "@/lib/supabase/server";
import { formatCountry, isInternalCountryLabel } from "@/lib/analytics/geo";
import { normalizeVisitorKey } from "@/lib/analytics/visitor";
import type { AnalyticsBundle, AnalyticsSummary, PremiumAnalyticsSummary } from "@/lib/types/analytics";

type AnalyticsEventRow = {
  id: string;
  event_type: string;
  link_id: string | null;
  visitor_hash: string;
  country: string | null;
  created_at: string;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getLocalDateKey(iso: string): string {
  return formatLocalDateKey(new Date(iso));
}

function getVisitorId(hash: string) {
  return normalizeVisitorKey(hash);
}

function buildDailySeries(
  events: { created_at: string }[],
  days: number,
): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    counts.set(formatLocalDateKey(d), 0);
  }

  for (const event of events) {
    const key = getLocalDateKey(event.created_at);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

function pctChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

async function fetchAnalyticsEvents(
  profileId: string,
  days: number,
): Promise<{ events: AnalyticsEventRow[]; error: string | null }> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("analytics_events")
    .select("id, event_type, link_id, visitor_hash, country, created_at")
    .eq("profile_id", profileId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return { events: [], error: error.message };
  }

  return { events: (data ?? []) as AnalyticsEventRow[], error: null };
}

function buildSummary(events: AnalyticsEventRow[], days: number): AnalyticsSummary {
  const views = events.filter((e) => e.event_type === "profile_view");
  const clicks = events.filter((e) => e.event_type === "link_click");

  const uniqueVisitors = new Set(views.map((v) => getVisitorId(v.visitor_hash))).size;

  const countryMap = new Map<string, number>();
  for (const event of events) {
    const label = formatCountry(event.country || "UNKNOWN");
    countryMap.set(label, (countryMap.get(label) ?? 0) + 1);
  }

  const hasExternalCountries = Array.from(countryMap.keys()).some((label) => !isInternalCountryLabel(label));

  const countries = Array.from(countryMap.entries())
    .filter(([label]) => !hasExternalCountries || !isInternalCountryLabel(label))
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return {
    totalViews: views.length,
    uniqueVisitors,
    totalClicks: clicks.length,
    dailyViews: buildDailySeries(views, days),
    dailyClicks: buildDailySeries(clicks, days),
    countries,
    topLinks: [],
  };
}

async function attachTopLinks(
  summary: AnalyticsSummary,
  linkClickMap: Map<string, number>,
): Promise<AnalyticsSummary> {
  const linkIds = Array.from(linkClickMap.keys());
  if (linkIds.length === 0) return summary;

  const supabase = await createClient();
  const { data: links } = await supabase.from("links").select("id, title").in("id", linkIds);

  const topLinks = (links ?? [])
    .map((link) => ({ linkId: link.id, title: link.title, clicks: linkClickMap.get(link.id) ?? 0 }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  return { ...summary, topLinks };
}

function buildPremiumSummary(events: AnalyticsEventRow[], days: number): PremiumAnalyticsSummary {
  const views = events.filter((e) => e.event_type === "profile_view");
  const clicks = events.filter((e) => e.event_type === "link_click");

  const visitorDays = new Map<string, Set<string>>();
  for (const view of views) {
    const id = getVisitorId(view.visitor_hash);
    const day = getLocalDateKey(view.created_at);
    if (!visitorDays.has(id)) visitorDays.set(id, new Set());
    visitorDays.get(id)!.add(day);
  }

  let returningVisitors = 0;
  let newVisitors = 0;
  for (const daysSeen of visitorDays.values()) {
    if (daysSeen.size > 1) returningVisitors += 1;
    else newVisitors += 1;
  }

  const dailyViews = buildDailySeries(views, days);
  const dailyClicks = buildDailySeries(clicks, days);
  const activeDays = dailyViews.filter((d) => d.count > 0).length;

  const hourlyCounts = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: formatHourLabel(hour),
    count: 0,
  }));
  for (const view of views) {
    hourlyCounts[new Date(view.created_at).getHours()].count += 1;
  }
  const peakHour = hourlyCounts.reduce((best, row) => (row.count > best.count ? row : best), hourlyCounts[0]);

  const weekdayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekdayCounts = new Map(weekdayOrder.map((day) => [day, 0]));
  for (const view of views) {
    const label = WEEKDAY_LABELS[new Date(view.created_at).getDay()];
    weekdayCounts.set(label, (weekdayCounts.get(label) ?? 0) + 1);
  }
  const weekdayViews = weekdayOrder.map((day) => ({ day, count: weekdayCounts.get(day) ?? 0 }));
  const peakWeekday = weekdayViews.reduce(
    (best, row) => (row.count > best.count ? row : best),
    weekdayViews[0] ?? { day: "Mon", count: 0 },
  );

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const last7Start = new Date(today);
  last7Start.setDate(last7Start.getDate() - 6);
  last7Start.setHours(0, 0, 0, 0);
  const prev7Start = new Date(today);
  prev7Start.setDate(prev7Start.getDate() - 13);
  prev7Start.setHours(0, 0, 0, 0);
  const prev7End = new Date(today);
  prev7End.setDate(prev7End.getDate() - 7);
  prev7End.setHours(23, 59, 59, 999);

  function countInRange(list: AnalyticsEventRow[], start: Date, end: Date) {
    return list.filter((event) => {
      const created = new Date(event.created_at);
      return created >= start && created <= end;
    }).length;
  }

  const viewsLast7 = countInRange(views, last7Start, today);
  const viewsPrev7 = countInRange(views, prev7Start, prev7End);
  const clicksLast7 = countInRange(clicks, last7Start, today);
  const clicksPrev7 = countInRange(clicks, prev7Start, prev7End);

  const clickByDate = new Map(dailyClicks.map((d) => [d.date, d.count]));
  const dailyEngagement = dailyViews.map((row) => {
    const dayClicks = clickByDate.get(row.date) ?? 0;
    return {
      date: row.date,
      views: row.count,
      clicks: dayClicks,
      ctr: row.count > 0 ? (dayClicks / row.count) * 100 : 0,
    };
  });

  return {
    returningVisitors,
    newVisitors,
    activeDays,
    peakHour,
    peakWeekday,
    growth: {
      viewsLast7,
      viewsPrev7,
      clicksLast7,
      clicksPrev7,
      viewsChangePct: pctChange(viewsLast7, viewsPrev7),
      clicksChangePct: pctChange(clicksLast7, clicksPrev7),
    },
    hourlyViews: hourlyCounts,
    weekdayViews,
    dailyEngagement,
    linkPerformance: [],
  };
}

async function attachLinkPerformance(
  premium: PremiumAnalyticsSummary,
  linkClickMap: Map<string, number>,
  totalClicks: number,
): Promise<PremiumAnalyticsSummary> {
  const linkIds = Array.from(linkClickMap.keys());
  if (linkIds.length === 0) return premium;

  const supabase = await createClient();
  const { data: links } = await supabase.from("links").select("id, title").in("id", linkIds);

  const linkPerformance = (links ?? [])
    .map((link) => {
      const clickCount = linkClickMap.get(link.id) ?? 0;
      return {
        linkId: link.id,
        title: link.title,
        clicks: clickCount,
        sharePct: totalClicks > 0 ? (clickCount / totalClicks) * 100 : 0,
      };
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 8);

  return { ...premium, linkPerformance };
}

export async function getAnalyticsBundle(profileId: string, days = 30): Promise<AnalyticsBundle> {
  const { events, error } = await fetchAnalyticsEvents(profileId, days);
  if (error) {
    console.error("[analytics] failed to load events:", error);
  }

  const clicks = events.filter((e) => e.event_type === "link_click");
  const linkClickMap = new Map<string, number>();
  for (const click of clicks) {
    if (click.link_id) linkClickMap.set(click.link_id, (linkClickMap.get(click.link_id) ?? 0) + 1);
  }

  const summary = await attachTopLinks(buildSummary(events, days), linkClickMap);
  const premium = await attachLinkPerformance(buildPremiumSummary(events, days), linkClickMap, clicks.length);

  return { summary, premium };
}

export async function getAnalyticsSummary(profileId: string, days = 30): Promise<AnalyticsSummary> {
  const bundle = await getAnalyticsBundle(profileId, days);
  return bundle.summary;
}

export async function getTotalAnalytics(profileId: string) {
  const supabase = await createClient();

  const [{ count: totalViews }, { count: totalClicks }, { data: visitorRows, error }] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("event_type", "profile_view"),
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("event_type", "link_click"),
    supabase
      .from("analytics_events")
      .select("visitor_hash")
      .eq("profile_id", profileId)
      .eq("event_type", "profile_view"),
  ]);

  if (error) {
    console.error("[analytics] failed to load totals:", error.message);
  }

  const uniqueVisitors = new Set((visitorRows ?? []).map((v) => getVisitorId(v.visitor_hash))).size;

  return {
    totalViews: totalViews ?? 0,
    totalClicks: totalClicks ?? 0,
    uniqueVisitors,
  };
}

export async function getPublicViewCount(profileId: string) {
  const { readPublicViewCount } = await import("@/lib/analytics/record-profile-view");
  return readPublicViewCount(profileId);
}
