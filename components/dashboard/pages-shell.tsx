"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProfilePageAction,
  deleteProfilePageAction,
  duplicateProfilePageAction,
  reorderProfilePagesAction,
  toggleProfilePagePublishedAction,
  updatePageNavPositionAction,
  updateProfilePageAction,
} from "@/app/actions/profile-pages";
import { PremiumLocked } from "@/components/premium/premium-locked";
import { IconHome } from "@/components/icons/dashboard-icons";
import {
  cardClassName,
  buttonPrimaryClassName,
  PageHeader,
  FormFeedback,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-fields";
import { SITE_HOST } from "@/lib/site";
import { PAGE_NAV_POSITION_OPTIONS } from "@/lib/settings";
import type { ProfilePage } from "@/lib/profile-pages/slug";
import type { PageNavPosition } from "@/lib/types/settings";
import type { UserEntitlements } from "@/lib/premium/types";

export function PagesShell({
  pages: initialPages,
  username,
  entitlements,
  pageNavPosition: initialPageNavPosition,
}: {
  pages: ProfilePage[];
  username: string | null;
  entitlements: UserEntitlements;
  pageNavPosition: PageNavPosition;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pages, setPages] = useState(initialPages);
  const [pageNavPosition, setPageNavPosition] = useState(initialPageNavPosition);
  const [slug, setSlug] = useState("");
  const [label, setLabel] = useState("");
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>();
  const [navFeedback, setNavFeedback] = useState<{ error?: string; success?: string }>();
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const allowed = entitlements.can_use_multiple_profiles;

  useEffect(() => {
    setPages(initialPages);
  }, [initialPages]);

  useEffect(() => {
    setPageNavPosition(initialPageNavPosition);
  }, [initialPageNavPosition]);

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createProfilePageAction({ slug, label });
      setFeedback(result);
      if (!result.error) {
        setSlug("");
        setLabel("");
        if (result.pageId) {
          router.push(`/dashboard/pages/${result.pageId}/text`);
        } else {
          router.refresh();
        }
      }
    });
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex || !allowed) {
      setDragIndex(null);
      return;
    }
    const reordered = [...pages];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setPages(reordered);
    setDragIndex(null);
    startTransition(async () => {
      await reorderProfilePagesAction(reordered.map((p) => p.id));
      router.refresh();
    });
  };

  const handleNavPositionChange = (value: PageNavPosition) => {
    if (!allowed || value === pageNavPosition) return;
    setPageNavPosition(value);
    startTransition(async () => {
      const result = await updatePageNavPositionAction(value);
      setNavFeedback(result);
      if (result.error) {
        setPageNavPosition(initialPageNavPosition);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div>
      <PageHeader
        title="Pages"
        description="Build a personal website. Your Home page is your profile — every other page is a blank content canvas."
      />

      <div className={`${cardClassName} mb-6`}>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white">
            <IconHome size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-white">Home</p>
            <p className="text-sm text-neutral-500">
              Your main profile — identity, enter gate, followers, and support chat.
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              {SITE_HOST}/{username ?? "…"}
            </p>
          </div>
          <Link
            href={username ? `/${username}` : "/dashboard/profile"}
            target="_blank"
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:bg-white/[0.06] hover:text-white"
          >
            View live
          </Link>
        </div>
      </div>

      <PremiumLocked allowed={allowed} className="mb-6">
        <div className={cardClassName}>
          <h2 className="mb-1 text-sm font-medium text-white">Create a content page</h2>
          <p className="mb-4 text-xs text-neutral-500">
            Starts blank with just a title. Add links, embeds, music, and styling after creating.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>Tab label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Gallery"
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>URL slug</label>
              <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-black/20 px-3">
                <span className="text-xs text-neutral-600">/{username}/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="gallery"
                  className="bf-input flex-1 border-0 bg-transparent px-0"
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={isPending || !slug.trim() || !label.trim()}
            onClick={handleCreate}
            className={`${buttonPrimaryClassName} mt-4`}
          >
            {isPending ? "Creating…" : "Create page"}
          </button>
          <FormFeedback {...feedback} />
        </div>
      </PremiumLocked>

      {allowed && pages.length > 0 ? (
        <div className={`${cardClassName} mb-6`}>
          <h2 className="mb-1 text-sm font-medium text-white">Page navigation bar</h2>
          <p className="mb-4 text-xs text-neutral-500">
            Choose where visitors see tabs for your Home page and content pages.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PAGE_NAV_POSITION_OPTIONS.map((option) => {
              const active = pageNavPosition === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleNavPositionChange(option.value)}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    active
                      ? "border-[var(--bf-accent)]/40 bg-[var(--bf-accent)]/10"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
                  }`}
                >
                  <p className={`text-sm font-medium ${active ? "text-white" : "text-neutral-300"}`}>
                    {option.label}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">{option.description}</p>
                </button>
              );
            })}
          </div>
          <FormFeedback {...navFeedback} />
        </div>
      ) : null}

      <div className={cardClassName}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-white">Your pages</h2>
          {allowed && pages.length > 1 ? (
            <p className="text-xs text-neutral-600">Drag to reorder nav tabs</p>
          ) : null}
        </div>

        <div className="space-y-2">
          {pages.map((page, index) => (
            <PageRow
              key={page.id}
              page={page}
              username={username}
              index={index}
              allowed={allowed}
              isPending={isPending}
              isDragging={dragIndex === index}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragIndex !== null && dragIndex !== index) setDragIndex(index);
              }}
              onDrop={() => handleDrop(index)}
              onRefresh={() => router.refresh()}
            />
          ))}
          {!pages.length ? (
            <p className="py-6 text-center text-sm text-neutral-600">
              {allowed
                ? "No content pages yet. Create one above to add tabs to your site nav."
                : "Upgrade to Premium Lite to add content pages to your site."}
            </p>
          ) : null}
        </div>

        {allowed ? (
          <p className="mt-4 text-xs text-neutral-600">
            {pages.length} / {entitlements.max_profile_pages} content pages used
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PageRow({
  page,
  username,
  index,
  allowed,
  isPending,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onRefresh,
}: {
  page: ProfilePage;
  username: string | null;
  index: number;
  allowed: boolean;
  isPending: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const run = (fn: () => Promise<{ error?: string; success?: string }>) => {
    startTransition(async () => {
      await fn();
      onRefresh();
    });
  };

  return (
    <div
      draggable={allowed}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 ${
        allowed ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-40" : ""}`}
    >
      {allowed ? (
        <span className="text-neutral-600 select-none" aria-hidden>
          ⠿
        </span>
      ) : null}
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-xs text-neutral-600">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-white">{page.label || page.slug}</p>
          {!page.published ? (
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
              Draft
            </span>
          ) : null}
        </div>
        <p className="text-sm text-neutral-500">
          {SITE_HOST}/{username}/{page.slug}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Link
          href={`/dashboard/pages/${page.id}/text`}
          className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/[0.1]"
        >
          Edit
        </Link>
        {allowed ? (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                run(() =>
                  toggleProfilePagePublishedAction(page.id, !page.published),
                )
              }
              className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:bg-white/[0.06] hover:text-white"
            >
              {page.published ? "Unpublish" : "Publish"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                const next = prompt("Tab label", page.label || page.slug);
                if (!next) return;
                run(() => updateProfilePageAction(page.id, { label: next }));
              }}
              className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:bg-white/[0.06] hover:text-white"
            >
              Rename
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await duplicateProfilePageAction(page.id);
                  if (result.pageId) {
                    router.push(`/dashboard/pages/${result.pageId}/text`);
                  } else {
                    onRefresh();
                  }
                })
              }
              className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:bg-white/[0.06] hover:text-white"
            >
              Duplicate
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!confirm("Delete this page and all its content?")) return;
                run(() => deleteProfilePageAction(page.id));
              }}
              className="rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
            >
              Delete
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
