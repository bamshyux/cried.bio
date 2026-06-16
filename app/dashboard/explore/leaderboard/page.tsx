import { redirect } from "next/navigation";
import { LeaderboardShell } from "@/components/dashboard/leaderboard/leaderboard-shell";
import { fetchLeaderboard, fetchLeaderboardPodium } from "@/lib/data/leaderboard";
import { LEADERBOARD_PAGE_SIZE } from "@/lib/types/leaderboard";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const tab = "views" as const;
  const period = "all" as const;
  const query = "";

  const [podium, list] = await Promise.all([
    fetchLeaderboardPodium(tab, period, query, userId),
    fetchLeaderboard({
      tab,
      period,
      query,
      page: 1,
      pageSize: LEADERBOARD_PAGE_SIZE,
      userId,
      skipTop: 3,
    }),
  ]);

  return (
    <LeaderboardShell
      currentUserId={userId}
      initial={{ podium, list, tab, period, query }}
    />
  );
}
