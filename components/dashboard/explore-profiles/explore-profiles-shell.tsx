"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Reveal } from "@/components/home/reveal";
import { SITE_HOST } from "@/lib/site";
import type {
  ExploreProfile,
  ExploreProfilesResult,
  SuggestedExploreProfile,
  SuggestedProfileReason,
} from "@/lib/types/explore-profiles";

function reasonLabel(reason: SuggestedProfileReason): string {
  switch (reason) {
    case "featured":
      return "Featured";
    case "network":
      return "In your network";
    case "popular":
      return "Popular";
    case "recent":
      return "New";
    default:
      return "Suggested";
  }
}

function ProfileAvatar({
  profile,
  size = 48,
}: {
  profile: Pick<ExploreProfile, "display_name" | "username" | "avatar_url">;
  size?: number;
}) {
  const initials = (profile.display_name || profile.username).charAt(0).toUpperCase();

  if (profile.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover ring-1 ring-white/10"
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-neutral-600 to-neutral-800 text-sm font-semibold text-white ring-1 ring-white/10"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

function ExploreProfileCard({
  profile,
  index,
  compact = false,
  badge,
}: {
  profile: ExploreProfile;
  index: number;
  compact?: boolean;
  badge?: string;
}) {
  return (
    <Reveal delay={index * 55}>
      <Link
        href={`/${profile.username}`}
        target="_blank"
        rel="noreferrer"
        className={`bf-explore-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111] transition-all hover:border-white/[0.14] hover:bg-[#161616] ${
          compact ? "p-4" : "p-5"
        }`}
        style={{ animationDelay: `${index * 55}ms` }}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/[0.03] blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />

        <div className="flex items-start gap-3">
          <ProfileAvatar profile={profile} size={compact ? 40 : 48} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-white group-hover:text-[#fafafa]">
                {profile.display_name}
              </p>
              {profile.premium_tier === "premium" ? (
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200/90">
                  Premium
                </span>
              ) : null}
              {badge ? (
                <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-neutral-400">
                  {badge}
                </span>
              ) : null}
            </div>
            <p className="truncate font-mono text-xs text-neutral-500">
              {SITE_HOST}/{profile.username}
            </p>
          </div>
          <svg
            className="h-4 w-4 shrink-0 text-neutral-600 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </div>

        {profile.bio ? (
          <p className={`mt-3 line-clamp-2 text-xs leading-relaxed text-neutral-500 ${compact ? "mt-2" : ""}`}>
            {profile.bio}
          </p>
        ) : null}

        <div className="mt-auto flex items-center gap-3 pt-4 text-[11px] text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {profile.view_count.toLocaleString()} views
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled: boolean;
}) {
  if (totalPages <= 1) return null;

  const pages = useMemo(() => {
    const items: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i += 1) items.push(i);
    return items;
  }, [page, totalPages]);

  return (
    <div className="bf-explore-pagination flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-xl border border-white/[0.08] bg-[#111] px-3 py-2 text-sm text-neutral-400 transition hover:border-white/[0.14] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>

      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          disabled={disabled}
          onClick={() => onPageChange(pageNumber)}
          className={`min-w-10 rounded-xl border px-3 py-2 text-sm transition ${
            pageNumber === page
              ? "border-white/[0.18] bg-white/[0.08] font-medium text-white"
              : "border-white/[0.08] bg-[#111] text-neutral-400 hover:border-white/[0.14] hover:text-white"
          }`}
        >
          {pageNumber}
        </button>
      ))}

      <button
        type="button"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-xl border border-white/[0.08] bg-[#111] px-3 py-2 text-sm text-neutral-400 transition hover:border-white/[0.14] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="bf-explore-skeleton h-[168px] rounded-2xl border border-white/[0.05] bg-[#111]"
          style={{ animationDelay: `${index * 80}ms` }}
        />
      ))}
    </div>
  );
}

export function ExploreProfilesShell({
  initial,
  suggested,
}: {
  initial: ExploreProfilesResult;
  suggested: SuggestedExploreProfile[];
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [result, setResult] = useState(initial);
  const [page, setPage] = useState(initial.page);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 320);
    return () => window.clearTimeout(timer);
  }, [query]);

  const skipInitialFetch = useRef(true);

  const fetchPage = useCallback(
    (nextPage: number, nextQuery: string) => {
      startTransition(async () => {
        const params = new URLSearchParams({
          page: String(nextPage),
          q: nextQuery,
        });

        const response = await fetch(`/api/dashboard/explore-profiles?${params.toString()}`);
        if (!response.ok) return;

        const data = (await response.json()) as ExploreProfilesResult;
        setResult(data);
        setPage(data.page);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    },
    [],
  );

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    fetchPage(1, debouncedQuery);
  }, [debouncedQuery, fetchPage]);

  const summary = useMemo(() => {
    if (result.query) {
      return `${result.total.toLocaleString()} result${result.total === 1 ? "" : "s"} for “${result.query}”`;
    }
    return `${result.total.toLocaleString()} public profile${result.total === 1 ? "" : "s"}`;
  }, [result.query, result.total]);

  return (
    <div className="bf-explore-page space-y-10">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111] p-6 sm:p-8">
          <div className="bf-explore-hero-glow pointer-events-none absolute inset-0" aria-hidden />
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Explore</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Explore Profiles
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
            Discover creators on cried.bio, search the community, and jump straight to live pages.
          </p>

          <div className="bf-explore-search mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3 transition-colors focus-within:border-white/[0.16]">
            <svg
              className="h-5 w-5 shrink-0 text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by username, name, or bio…"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
              aria-label="Search profiles"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-lg px-2 py-1 text-xs text-neutral-500 transition hover:bg-white/[0.04] hover:text-neutral-300"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </Reveal>

      {suggested.length > 0 && !debouncedQuery ? (
        <section className="space-y-4">
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                  Suggested for you
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">Profiles you might like</h2>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {suggested.map((profile, index) => (
              <ExploreProfileCard
                key={profile.id}
                profile={profile}
                index={index}
                compact
                badge={reasonLabel(profile.reason)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-5">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">All profiles</h2>
              <p className="mt-1 text-sm text-neutral-500">{summary}</p>
            </div>
            <p className="text-xs text-neutral-600">
              Page {result.page} of {Math.max(result.totalPages, 1)}
            </p>
          </div>
        </Reveal>

        {isPending ? (
          <LoadingGrid />
        ) : result.profiles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.profiles.map((profile, index) => (
              <ExploreProfileCard key={profile.id} profile={profile} index={index} />
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#111]/60 px-6 py-16 text-center">
              <p className="text-base font-medium text-white">No profiles found</p>
              <p className="mt-2 text-sm text-neutral-500">
                Try a different search term or browse suggested profiles above.
              </p>
            </div>
          </Reveal>
        )}

        <Pagination
          page={page}
          totalPages={result.totalPages}
          disabled={isPending}
          onPageChange={(nextPage) => fetchPage(nextPage, debouncedQuery)}
        />
      </section>
    </div>
  );
}
