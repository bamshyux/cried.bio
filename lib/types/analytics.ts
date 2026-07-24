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

export type PremiumAnalyticsSummary = {
  returningVisitors: number;
  newVisitors: number;
  activeDays: number;
  peakHour: { hour: number; label: string; count: number };
  peakWeekday: { day: string; count: number };
  growth: {
    viewsLast7: number;
    viewsPrev7: number;
    clicksLast7: number;
    clicksPrev7: number;
    viewsChangePct: number;
    clicksChangePct: number;
  };
  hourlyViews: { hour: number; label: string; count: number }[];
  weekdayViews: { day: string; count: number }[];
  dailyEngagement: { date: string; views: number; clicks: number; ctr: number }[];
  linkPerformance: { linkId: string; title: string; clicks: number; sharePct: number }[];
};

export type AnalyticsBundle = {
  summary: AnalyticsSummary;
  premium: PremiumAnalyticsSummary;
};
