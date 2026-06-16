import { fetchLeaderboard, fetchLeaderboardPodium } from "@/lib/data/leaderboard";
import type { LeaderboardPeriod, LeaderboardTab } from "@/lib/types/leaderboard";
import { LEADERBOARD_PAGE_SIZE } from "@/lib/types/leaderboard";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const VALID_TABS = new Set<LeaderboardTab>(["views", "followers"]);
const VALID_PERIODS = new Set<LeaderboardPeriod>(["today", "week", "month", "all"]);

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = data.claims.sub as string;
  const { searchParams } = new URL(request.url);
  const tab = (searchParams.get("tab") ?? "views") as LeaderboardTab;
  const period = (searchParams.get("period") ?? "all") as LeaderboardPeriod;
  const query = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  if (!VALID_TABS.has(tab) || !VALID_PERIODS.has(period)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const [podium, list] = await Promise.all([
    fetchLeaderboardPodium(tab, period, query, userId),
    fetchLeaderboard({
      tab,
      period,
      query,
      page: Number.isFinite(page) ? page : 1,
      pageSize: LEADERBOARD_PAGE_SIZE,
      userId,
      skipTop: 3,
    }),
  ]);

  return NextResponse.json({ podium, list, tab, period, query });
}
