export type LeaderboardTab = "views" | "followers";

export type LeaderboardPeriod = "today" | "week" | "month" | "all";

export type LeaderboardEntry = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  rank: number;
  stat_count: number;
  views: number;
  followers: number;
  is_following: boolean;
};

export type LeaderboardResult = {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  tab: LeaderboardTab;
  period: LeaderboardPeriod;
  query: string;
};

export const LEADERBOARD_PAGE_SIZE = 20;

export const LEADERBOARD_PERIODS: { id: LeaderboardPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "all", label: "All Time" },
];
