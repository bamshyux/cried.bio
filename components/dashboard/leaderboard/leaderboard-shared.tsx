import Image from "next/image";
import type { LeaderboardEntry } from "@/lib/types/leaderboard";

export function LeaderboardAvatar({
  entry,
  size = 48,
  className = "",
}: {
  entry: Pick<LeaderboardEntry, "display_name" | "username" | "avatar_url">;
  size?: number;
  className?: string;
}) {
  const initials = (entry.display_name || entry.username).charAt(0).toUpperCase();

  if (entry.avatar_url) {
    return (
      <Image
        src={entry.avatar_url}
        alt=""
        width={size}
        height={size}
        className={`rounded-full object-cover ring-2 ring-white/10 ${className}`}
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-neutral-600 to-neutral-800 text-sm font-bold text-white ring-2 ring-white/10 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

export function rankMedalClass(rank: number): string {
  if (rank === 1) return "bf-leaderboard-rank-gold";
  if (rank === 2) return "bf-leaderboard-rank-silver";
  if (rank === 3) return "bf-leaderboard-rank-bronze";
  return "bf-leaderboard-rank-default";
}

export function rankEmoji(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export function formatStat(n: number): string {
  return n.toLocaleString();
}
