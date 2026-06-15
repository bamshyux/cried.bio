import { createClient } from "@/lib/supabase/server";
import { formatCountry, isInternalCountryLabel } from "@/lib/analytics/geo";
import { normalizeVisitorKey } from "@/lib/analytics/visitor";
import type { AnalyticsSummary } from "@/lib/types/analytics";

function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getLocalDateKey(iso: string): string {
  return formatLocalDateKey(new Date(iso));
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

export async function getAnalyticsSummary(
  profileId: string,
  days = 30,
): Promise<AnalyticsSummary> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

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
  for (const event of all) {
    const label = formatCountry(event.country || "UNKNOWN");
    countryMap.set(label, (countryMap.get(label) ?? 0) + 1);
  }

  const hasExternalCountries = Array.from(countryMap.keys()).some((label) => !isInternalCountryLabel(label));

  const countries = Array.from(countryMap.entries())
    .filter(([label]) => !hasExternalCountries || !isInternalCountryLabel(label))
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

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

function getVisitorId(hash: string) {
  return normalizeVisitorKey(hash);
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
