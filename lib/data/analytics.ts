import { createClient } from "@/lib/supabase/server";
import { formatCountry } from "@/lib/analytics/geo";
import { normalizeVisitorKey } from "@/lib/analytics/visitor";
import type { AnalyticsSummary } from "@/lib/types/analytics";

function getDateKey(iso: string) {
  return iso.slice(0, 10);
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

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    counts.set(d.toISOString().slice(0, 10), 0);
  }

  for (const event of events) {
    const key = getDateKey(event.created_at);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

export async function getAnalyticsSummary(
  profileId: string,
  days = 30,
): Promise<AnalyticsSummary> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: events } = await supabase
    .from("analytics_events")
    .select("id, event_type, link_id, visitor_hash, country, created_at")
    .eq("profile_id", profileId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  const all = events ?? [];
  const views = all.filter((e) => e.event_type === "profile_view");
  const clicks = all.filter((e) => e.event_type === "link_click");

  const uniqueVisitors = new Set(views.map((v) => getVisitorId(v.visitor_hash))).size;

  const countryMap = new Map<string, number>();
  for (const view of views) {
    const c = formatCountry(view.country || "Unknown");
    countryMap.set(c, (countryMap.get(c) ?? 0) + 1);
  }

  const countries = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const linkClickMap = new Map<string, number>();
  for (const click of clicks) {
    if (click.link_id) linkClickMap.set(click.link_id, (linkClickMap.get(click.link_id) ?? 0) + 1);
  }

  let topLinks: AnalyticsSummary["topLinks"] = [];
  const linkIds = Array.from(linkClickMap.keys());

  if (linkIds.length > 0) {
    const { data: links } = await supabase.from("links").select("id, title").in("id", linkIds);
    topLinks = (links ?? [])
      .map((link) => ({ linkId: link.id, title: link.title, clicks: linkClickMap.get(link.id) ?? 0 }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
  }

  return {
    totalViews: views.length,
    uniqueVisitors,
    totalClicks: clicks.length,
    dailyViews: buildDailySeries(views, days),
    dailyClicks: buildDailySeries(clicks, days),
    countries,
    topLinks,
  };
}

export async function getTotalAnalytics(profileId: string) {
  const supabase = await createClient();

  const { data: views } = await supabase
    .from("analytics_events")
    .select("visitor_hash")
    .eq("profile_id", profileId)
    .eq("event_type", "profile_view");

  const { count: totalClicks } = await supabase
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .eq("event_type", "link_click");

  const uniqueVisitors = new Set((views ?? []).map((v) => getVisitorId(v.visitor_hash))).size;

  return {
    totalViews: views?.length ?? 0,
    totalClicks: totalClicks ?? 0,
    uniqueVisitors,
  };
}

export async function getPublicViewCount(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("analytics_events")
    .select("visitor_hash")
    .eq("profile_id", profileId)
    .eq("event_type", "profile_view");

  return new Set((data ?? []).map((row) => normalizeVisitorKey(row.visitor_hash))).size;
}
