export type AnalyticsEventType = "profile_view" | "link_click";

export type AnalyticsSummary = {
  totalViews: number;
  uniqueVisitors: number;
  totalClicks: number;
  dailyViews: { date: string; count: number }[];
  dailyClicks: { date: string; count: number }[];
  countries: { country: string; count: number }[];
  topLinks: { linkId: string; title: string; clicks: number }[];
};
