"use client";

import Link from "next/link";
import { Reveal } from "@/components/home/reveal";
import type { CommunityThemeListing } from "@/lib/types/community-theme";
import { COMMUNITY_THEME_CATEGORIES } from "@/lib/types/community-theme";

function categoryLabel(category: string): string {
  return COMMUNITY_THEME_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function CommunityThemePreviewCard({
  theme,
}: {
  theme: CommunityThemeListing;
  previewCss?: string | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0a]">
      <div
        className="absolute inset-0"
        style={{ background: theme.preview_style }}
        aria-hidden
      />
      {theme.preview_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={theme.preview_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      ) : null}
      <div className="relative flex min-h-[140px] flex-col justify-end p-4">
        <div className="rounded-lg border border-white/10 bg-black/45 p-3 backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Theme preview</p>
          <p className="mt-1 truncate text-sm font-medium text-white">{theme.title}</p>
        </div>
      </div>
    </div>
  );
}

export function CommunityThemeCard({
  theme,
  index,
  onInstall,
  onLike,
  onPreview,
  onShare,
  onReport,
  onClone,
  busy,
}: {
  theme: CommunityThemeListing;
  index: number;
  onInstall: () => void;
  onLike: () => void;
  onPreview: () => void;
  onShare: () => void;
  onReport: () => void;
  onClone?: () => void;
  busy?: boolean;
}) {
  return (
    <Reveal delay={index * 50}>
      <article
        className="bf-explore-card group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111] transition-all hover:border-white/[0.14] hover:bg-[#161616]"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <button type="button" onClick={onPreview} className="text-left">
          <CommunityThemePreviewCard theme={theme} />
        </button>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-white">{theme.title}</h3>
            {theme.visibility === "open_source" ? (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                Open Source
              </span>
            ) : null}
            {theme.is_staff_pick ? (
              <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-[10px] font-medium text-violet-200">
                Staff Pick
              </span>
            ) : null}
          </div>

          <Link
            href={`/${theme.creator_username}`}
            target="_blank"
            rel="noreferrer"
            className="mb-2 inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300"
          >
            by @{theme.creator_username}
          </Link>

          {theme.description ? (
            <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-neutral-500">{theme.description}</p>
          ) : null}

          <div className="mb-3 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-neutral-400">
              {categoryLabel(theme.category)}
            </span>
            {theme.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/[0.06] px-2 py-0.5 text-[10px] text-neutral-500"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-3 text-[11px] text-neutral-500">
            <span>{theme.install_count.toLocaleString()} installs</span>
            <span>{theme.like_count.toLocaleString()} likes</span>
            <span>{formatDate(theme.published_at ?? theme.created_at)}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onInstall}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-neutral-200 disabled:opacity-50"
            >
              {theme.installed_by_me ? "Re-apply" : "Install Theme"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onPreview}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-neutral-300 hover:border-white/[0.14] hover:text-white disabled:opacity-50"
            >
              Preview
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onLike}
              className={`rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50 ${
                theme.liked_by_me
                  ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
                  : "border-white/[0.08] text-neutral-300 hover:border-white/[0.14] hover:text-white"
              }`}
            >
              {theme.liked_by_me ? "Liked" : "Like"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onShare}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-neutral-300 hover:border-white/[0.14] hover:text-white disabled:opacity-50"
            >
              Share
            </button>
            {onClone ? (
              <button
                type="button"
                disabled={busy}
                onClick={onClone}
                className="rounded-lg border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
              >
                Clone
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={onReport}
              className="rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-neutral-500 hover:border-red-500/20 hover:text-red-300 disabled:opacity-50"
            >
              Report
            </button>
          </div>
        </div>
      </article>
    </Reveal>
  );
}
