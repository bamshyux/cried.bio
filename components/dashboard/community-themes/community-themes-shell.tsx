"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cloneCommunityThemeAction,
  deleteCommunityThemeListingAction,
  getCommunityThemePreviewAction,
  installCommunityThemeAction,
  reportCommunityThemeAction,
  toggleCommunityThemeLikeAction,
  unpublishCommunityThemeAction,
} from "@/app/actions/community-themes";
import { CustomThemePreview } from "@/components/dashboard/custom-theme-preview";
import { CommunityThemeCard } from "@/components/dashboard/community-themes/theme-card";
import {
  cardClassName,
  FormFeedback,
  inputClassName,
} from "@/components/dashboard/form-fields";
import { Reveal } from "@/components/home/reveal";
import { getSiteUrl } from "@/lib/site";
import type {
  CommunityThemeListing,
  CommunityThemeListingType,
  CommunityThemeReportReason,
  CommunityThemesResult,
  CommunityThemeSort,
} from "@/lib/types/community-theme";
import {
  COMMUNITY_LISTING_TYPE_FILTERS,
  COMMUNITY_THEME_CATEGORIES,
  COMMUNITY_THEME_SORTS,
} from "@/lib/types/community-theme";

function FeaturedRow({
  title,
  themes,
  onAction,
  busyId,
}: {
  title: string;
  themes: CommunityThemeListing[];
  onAction: (theme: CommunityThemeListing, action: string) => void;
  busyId: string | null;
}) {
  if (themes.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {themes.map((theme, index) => (
          <CommunityThemeCard
            key={theme.id}
            theme={theme}
            index={index}
            busy={busyId === theme.id}
            onInstall={() => onAction(theme, "install")}
            onPreview={() => onAction(theme, "preview")}
            onLike={() => onAction(theme, "like")}
            onShare={() => onAction(theme, "share")}
            onReport={() => onAction(theme, "report")}
            onClone={theme.visibility === "open_source" ? () => onAction(theme, "clone") : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export function CommunityThemesShell({
  initial,
  initialListingType = "all",
  featured,
  myPublished,
  username,
  displayName,
}: {
  userId: string;
  initial: CommunityThemesResult;
  initialListingType?: CommunityThemeListingType | "all";
  featured: {
    trending: CommunityThemeListing[];
    staffPicks: CommunityThemeListing[];
    newReleases: CommunityThemeListing[];
    weeklyInstalled: CommunityThemeListing[];
  };
  myPublished: CommunityThemeListing[];
  username?: string | null;
  displayName?: string | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"browse" | "mine">("browse");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [listingType, setListingType] = useState<CommunityThemeListingType | "all">(initialListingType);
  const [sort, setSort] = useState<CommunityThemeSort>("trending");
  const [result, setResult] = useState(initial);
  const [page, setPage] = useState(initial.page);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewCss, setPreviewCss] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<CommunityThemeListing | null>(null);
  const [reportTheme, setReportTheme] = useState<CommunityThemeListing | null>(null);
  const [reportReason, setReportReason] = useState<CommunityThemeReportReason>("inappropriate");
  const [reportDetails, setReportDetails] = useState("");
  const [isPending, startTransition] = useTransition();
  const skipInitialFetch = useRef(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 320);
    return () => window.clearTimeout(timer);
  }, [query]);

  const fetchPage = useCallback(
    (
      nextPage: number,
      nextQuery: string,
      nextCategory: string,
      nextSort: CommunityThemeSort,
      nextListingType: CommunityThemeListingType | "all",
    ) => {
      startTransition(async () => {
        const params = new URLSearchParams({
          page: String(nextPage),
          q: nextQuery,
          category: nextCategory,
          sort: nextSort,
        });
        if (nextListingType !== "all") {
          params.set("type", nextListingType);
        }
        const response = await fetch(`/api/dashboard/community-themes?${params.toString()}`);
        if (!response.ok) return;
        const data = (await response.json()) as CommunityThemesResult;
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
    fetchPage(1, debouncedQuery, category, sort, listingType);
  }, [debouncedQuery, category, sort, listingType, fetchPage]);

  const summary = useMemo(() => {
    const noun =
      listingType === "profile_preset"
        ? "profile preset"
        : listingType === "theme"
          ? "CSS theme"
          : "listing";
    const plural = listingType === "all" ? "listings" : `${noun}${result.total === 1 ? "" : "s"}`;
    if (result.query) {
      return `${result.total.toLocaleString()} ${plural} for “${result.query}”`;
    }
    if (listingType === "profile_preset") {
      return `${result.total.toLocaleString()} community profile preset${result.total === 1 ? "" : "s"}`;
    }
    if (listingType === "theme") {
      return `${result.total.toLocaleString()} community CSS theme${result.total === 1 ? "" : "s"}`;
    }
    return `${result.total.toLocaleString()} community theme${result.total === 1 ? "" : "s"}`;
  }, [result.query, result.total, listingType]);

  const handleThemeAction = (theme: CommunityThemeListing, action: string) => {
    if (action === "preview") {
      if (theme.listing_type === "profile_preset") {
        if (!username?.trim()) {
          setFeedback({ error: "Set a username before previewing presets." });
          return;
        }
        window.open(
          `/${username.trim()}?previewPreset=${theme.id}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }

      setPreviewTheme(theme);
      setPreviewCss(null);
      startTransition(async () => {
        const res = await getCommunityThemePreviewAction(theme.id);
        if (res.css) {
          setPreviewCss(res.css);
        } else {
          setFeedback({ error: res.error ?? "Preview unavailable." });
        }
      });
      return;
    }

    if (action === "share") {
      const url = `${getSiteUrl()}/dashboard/explore/themes?theme=${theme.id}`;
      void navigator.clipboard.writeText(url).then(() => {
        setFeedback({
          success:
            theme.listing_type === "profile_preset"
              ? "Preset link copied to clipboard."
              : "Theme link copied to clipboard.",
        });
      });
      return;
    }

    if (action === "report") {
      setReportTheme(theme);
      return;
    }

    setBusyId(theme.id);
    startTransition(async () => {
      let res: { error?: string; success?: string; liked?: boolean } = { error: "Unknown action." };

      if (action === "install") {
        const isPreset = theme.listing_type === "profile_preset";
        const confirmed =
          theme.installed_by_me ||
          window.confirm(
            isPreset
              ? `Install "${theme.title}" and apply this full profile preset? This replaces your layout, colors, links, widgets, and more.`
              : `Install "${theme.title}" and apply it to your profile?`,
          );
        if (!confirmed) {
          setBusyId(null);
          return;
        }
        res = await installCommunityThemeAction(theme.id, true);
      } else if (action === "like") {
        res = await toggleCommunityThemeLikeAction(theme.id);
      } else if (action === "clone") {
        res = await cloneCommunityThemeAction(theme.id);
      }

      setFeedback(res.error ? { error: res.error } : { success: res.success });
      setBusyId(null);
      fetchPage(page, debouncedQuery, category, sort, listingType);
      router.refresh();
    });
  };

  const handleManage = (listing: CommunityThemeListing, action: "unpublish" | "delete") => {
    const confirmed = window.confirm(
      action === "delete"
        ? "Delete this published theme permanently?"
        : "Unpublish this theme from Community Themes?",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res =
        action === "delete"
          ? await deleteCommunityThemeListingAction(listing.id)
          : await unpublishCommunityThemeAction(listing.id);
      setFeedback(res.error ? { error: res.error } : { success: res.success });
      router.refresh();
    });
  };

  const submitReport = () => {
    if (!reportTheme) return;
    startTransition(async () => {
      const res = await reportCommunityThemeAction({
        listingId: reportTheme.id,
        reason: reportReason,
        details: reportDetails,
      });
      setFeedback(res.error ? { error: res.error } : { success: res.success });
      setReportTheme(null);
      setReportDetails("");
    });
  };

  return (
    <div className="bf-explore-page space-y-10">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111] p-6 sm:p-8">
          <div className="bf-explore-hero-glow pointer-events-none absolute inset-0" aria-hidden />
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Explore</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {listingType === "profile_preset" ? "Community Presets" : "Community Themes"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
            {listingType === "profile_preset"
              ? "Browse and install full profile looks shared by the cried.bio community."
              : "Browse, preview, and install profile themes created by the cried.bio community."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {COMMUNITY_LISTING_TYPE_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setListingType(item.id)}
                className={`rounded-xl px-4 py-2 text-sm transition ${
                  listingType === item.id
                    ? "bg-white/[0.08] font-medium text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("browse")}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                tab === "browse"
                  ? "bg-white/[0.08] font-medium text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Browse
            </button>
            <button
              type="button"
              onClick={() => setTab("mine")}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                tab === "mine"
                  ? "bg-white/[0.08] font-medium text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              My Published
            </button>
            {listingType === "profile_preset" ? (
              <Link
                href="/dashboard/profile-presets"
                className="ml-auto rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-neutral-300 transition hover:border-white/[0.14] hover:text-white"
              >
                My Presets →
              </Link>
            ) : (
              <Link
                href="/dashboard/custom-theme"
                className="ml-auto rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-neutral-300 transition hover:border-white/[0.14] hover:text-white"
              >
                Open Custom Themes →
              </Link>
            )}
          </div>
        </div>
      </Reveal>

      <FormFeedback error={feedback.error} success={feedback.success} />

      {tab === "mine" ? (
        <section className={`${cardClassName} space-y-4`}>
          <div>
            <h2 className="text-lg font-semibold text-white">My Published</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Manage themes and profile presets you&apos;ve shared with the community.
            </p>
          </div>

          {myPublished.length === 0 ? (
            <p className="text-sm text-neutral-600">
              You haven&apos;t published anything yet. Share a{" "}
              <Link href="/dashboard/custom-theme" className="text-white hover:underline">
                Custom Theme
              </Link>{" "}
              or a{" "}
              <Link href="/dashboard/profile-presets" className="text-white hover:underline">
                Profile Preset
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-3">
              {myPublished.map((listing) => (
                <div
                  key={listing.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{listing.title}</p>
                      {listing.listing_type === "profile_preset" ? (
                        <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-[10px] text-violet-200">
                          Preset
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-neutral-500">
                      {listing.visibility} · {listing.install_count} installs · {listing.like_count} likes
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={
                        listing.listing_type === "profile_preset"
                          ? "/dashboard/profile-presets"
                          : "/dashboard/custom-theme"
                      }
                      className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-neutral-300 hover:text-white"
                    >
                      {listing.listing_type === "profile_preset" ? "Manage preset" : "Edit in builder"}
                    </Link>
                    {listing.visibility !== "private" ? (
                      <button
                        type="button"
                        onClick={() => handleManage(listing, "unpublish")}
                        className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-neutral-300 hover:text-white"
                      >
                        Unpublish
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleManage(listing, "delete")}
                      className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {listingType === "all" ? (
            <div className="space-y-8">
              <FeaturedRow title="Trending" themes={featured.trending} onAction={handleThemeAction} busyId={busyId} />
              <FeaturedRow title="Staff Picks" themes={featured.staffPicks} onAction={handleThemeAction} busyId={busyId} />
              <FeaturedRow title="New Releases" themes={featured.newReleases} onAction={handleThemeAction} busyId={busyId} />
              <FeaturedRow
                title="Most Installed This Week"
                themes={featured.weeklyInstalled}
                onAction={handleThemeAction}
                busyId={busyId}
              />
            </div>
          ) : null}

          <section className="space-y-5">
            <Reveal className="w-full">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-stretch">
                <div className="bf-explore-search flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3 transition-colors focus-within:border-white/[0.16]">
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
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      listingType === "profile_preset" ? "Search presets..." : "Search themes..."
                    }
                    className="min-w-0 w-full flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
                  />
                </div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as CommunityThemeSort)}
                  className="bf-explore-sort w-full rounded-2xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-3 text-sm text-white outline-none transition-colors hover:border-white/[0.12] focus:border-white/[0.16] sm:w-auto sm:min-w-[9.5rem]"
                  aria-label="Sort themes"
                >
                  {COMMUNITY_THEME_SORTS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </Reveal>

            <div className="flex flex-wrap gap-2">
              {COMMUNITY_THEME_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    category === item.id
                      ? "bg-white/[0.1] font-medium text-white"
                      : "bg-white/[0.04] text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {listingType === "profile_preset"
                      ? "All presets"
                      : listingType === "theme"
                        ? "All CSS themes"
                        : "All listings"}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">{summary}</p>
                </div>
                <p className="text-xs text-neutral-600">
                  Page {result.page} of {Math.max(result.totalPages, 1)}
                </p>
              </div>
            </Reveal>

            {isPending ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="bf-explore-skeleton h-[360px] rounded-2xl border border-white/[0.05] bg-[#111]"
                  />
                ))}
              </div>
            ) : result.themes.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {result.themes.map((theme, index) => (
                  <CommunityThemeCard
                    key={theme.id}
                    theme={theme}
                    index={index}
                    busy={busyId === theme.id}
                    onInstall={() => handleThemeAction(theme, "install")}
                    onPreview={() => handleThemeAction(theme, "preview")}
                    onLike={() => handleThemeAction(theme, "like")}
                    onShare={() => handleThemeAction(theme, "share")}
                    onReport={() => handleThemeAction(theme, "report")}
                    onClone={theme.visibility === "open_source" ? () => handleThemeAction(theme, "clone") : undefined}
                  />
                ))}
              </div>
            ) : (
              <Reveal>
                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#111]/60 px-6 py-16 text-center">
                  <p className="text-base font-medium text-white">No listings found</p>
                  <p className="mt-2 text-sm text-neutral-500">Try another search, type filter, or category.</p>
                </div>
              </Reveal>
            )}

            {result.totalPages > 1 ? (
              <div className="bf-explore-pagination flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={isPending || page <= 1}
                  onClick={() => fetchPage(page - 1, debouncedQuery, category, sort, listingType)}
                  className="rounded-xl border border-white/[0.08] bg-[#111] px-3 py-2 text-sm text-neutral-400 transition hover:text-white disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={isPending || page >= result.totalPages}
                  onClick={() => fetchPage(page + 1, debouncedQuery, category, sort, listingType)}
                  className="rounded-xl border border-white/[0.08] bg-[#111] px-3 py-2 text-sm text-neutral-400 transition hover:text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </section>
        </>
      )}

      {previewTheme ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={`${cardClassName} w-full max-w-3xl`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{previewTheme.title}</h3>
                <p className="text-xs text-neutral-500">by @{previewTheme.creator_username}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewTheme(null);
                  setPreviewCss(null);
                }}
                className="rounded-lg border border-white/[0.08] px-2 py-1 text-xs text-neutral-400 hover:text-white"
              >
                Close
              </button>
            </div>
            {previewCss ? (
              <CustomThemePreview css={previewCss} username={username} displayName={displayName} />
            ) : (
              <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-10 text-center text-sm text-neutral-500">
                Loading preview...
              </div>
            )}
          </div>
        </div>
      ) : null}

      {reportTheme ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className={`${cardClassName} w-full max-w-md`}>
            <h3 className="mb-2 text-sm font-semibold text-white">Report theme</h3>
            <p className="mb-4 text-xs text-neutral-500">{reportTheme.title}</p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as CommunityThemeReportReason)}
              className={`${inputClassName} mb-3`}
            >
              <option value="spam">Spam</option>
              <option value="inappropriate">Inappropriate</option>
              <option value="malicious">Malicious CSS</option>
              <option value="copyright">Copyright</option>
              <option value="other">Other</option>
            </select>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              className={`${inputClassName} mb-4 min-h-[88px]`}
              placeholder="Additional details (optional)"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportTheme(null)}
                className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-neutral-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={submitReport}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
              >
                Submit report
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
