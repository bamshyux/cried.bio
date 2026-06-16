"use client";

import Link from "next/link";
import type { LeaderboardEntry, LeaderboardTab } from "@/lib/types/leaderboard";
import { SITE_HOST } from "@/lib/site";
import { LeaderboardAvatar, formatStat, rankMedalClass } from "./leaderboard-shared";
import { LeaderboardFollowButton } from "./leaderboard-follow-button";
import { LeaderboardHoverPreview } from "./leaderboard-hover-preview";

export function LeaderboardRow({
  entry,
  tab,
  currentUserId,
  index,
}: {
  entry: LeaderboardEntry;
  tab: LeaderboardTab;
  currentUserId: string;
  index: number;
}) {
  const medalClass = rankMedalClass(entry.rank);

  return (
    <div
      className="bf-leaderboard-row group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111]/80 backdrop-blur-sm transition-all hover:border-white/[0.14] hover:bg-[#161616]/90"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative flex flex-wrap items-center gap-4 p-4 sm:gap-5 sm:p-5">
        <div className={`bf-leaderboard-rank flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold tabular-nums ${medalClass}`}>
          {entry.rank}
        </div>

        <LeaderboardHoverPreview entry={entry} tab={tab}>
          <Link
            href={`/${entry.username}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 flex-1 items-center gap-4"
          >
            <LeaderboardAvatar entry={entry} size={52} className="transition-transform group-hover:scale-105" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white group-hover:text-[#fafafa]">
                {entry.display_name}
              </p>
              <p className="truncate font-mono text-xs text-neutral-500">
                {SITE_HOST}/{entry.username}
              </p>
            </div>
          </Link>
        </LeaderboardHoverPreview>

        <div className="flex w-full flex-wrap items-center gap-3 sm:ml-auto sm:w-auto sm:gap-6">
          <div className="flex flex-wrap gap-4 text-xs text-neutral-400">
            {tab === "views" ? (
              <span className="inline-flex items-center gap-1.5">
                <EyeIcon />
                <span className="font-semibold text-neutral-200">{formatStat(entry.views)}</span>
                views
              </span>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <UsersIcon />
                  <span className="font-semibold text-neutral-200">{formatStat(entry.followers)}</span>
                  followers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <EyeIcon />
                  <span className="font-semibold text-neutral-200">{formatStat(entry.views)}</span>
                  views
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <LeaderboardFollowButton
              key={`${entry.id}-${entry.is_following}`}
              profileId={entry.id}
              initialFollowing={entry.is_following}
              currentUserId={currentUserId}
            />
            <Link
              href={`/${entry.username}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-white/[0.16] hover:text-white"
            >
              View profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
