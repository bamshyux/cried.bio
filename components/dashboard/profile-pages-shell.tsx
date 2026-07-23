"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProfilePageAction,
  deleteProfilePageAction,
  renameProfilePageAction,
} from "@/app/actions/profile-pages";
import { PremiumLocked } from "@/components/premium/premium-locked";
import { cardClassName, buttonPrimaryClassName, PageHeader, FormFeedback } from "@/components/dashboard/form-fields";
import { SITE_HOST } from "@/lib/site";
import type { ProfilePage } from "@/lib/profile-pages/slug";
import type { UserEntitlements } from "@/lib/premium/types";

export function ProfilePagesShell({
  pages,
  username,
  entitlements,
}: {
  pages: ProfilePage[];
  username: string | null;
  entitlements: UserEntitlements;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slug, setSlug] = useState("");
  const [label, setLabel] = useState("");
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>();

  const allowed = entitlements.can_use_multiple_profiles;

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createProfilePageAction({ slug, label });
      setFeedback(result);
      if (!result.error) {
        setSlug("");
        setLabel("");
        router.refresh();
      }
    });
  };

  return (
    <div>
      <PageHeader
        title="Profile Pages"
        description="Create up to 4 additional public profile pages with independent layouts, links, and music."
      />

      <PremiumLocked allowed={allowed} className="mb-6">
        <div className={cardClassName}>
          <h2 className="mb-4 text-sm font-medium text-white">Create a page</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-neutral-500">Slug</label>
              <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-black/20 px-3">
                <span className="text-xs text-neutral-600">{SITE_HOST}/{username}/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="gaming"
                  className="bf-input flex-1 border-0 bg-transparent px-0"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-neutral-500">Label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Gaming"
                className="bf-input w-full"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={isPending || !slug.trim()}
            onClick={handleCreate}
            className={`${buttonPrimaryClassName} mt-4`}
          >
            {isPending ? "Creating…" : "Create page"}
          </button>
          <FormFeedback {...feedback} />
        </div>
      </PremiumLocked>

      <div className={cardClassName}>
        <h2 className="mb-4 text-sm font-medium text-white">Your pages</h2>
        <div className="space-y-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="font-medium text-white">Primary</p>
            <p className="text-sm text-neutral-500">{SITE_HOST}/{username}</p>
          </div>
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div>
                <p className="font-medium text-white">{page.label || page.slug}</p>
                <p className="text-sm text-neutral-500">
                  {SITE_HOST}/{username}/{page.slug}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!allowed || isPending}
                  onClick={() => {
                    const next = prompt("New slug", page.slug);
                    if (!next) return;
                    startTransition(async () => {
                      await renameProfilePageAction(page.id, { slug: next });
                      router.refresh();
                    });
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:bg-white/[0.06] hover:text-white"
                >
                  Rename
                </button>
                <button
                  type="button"
                  disabled={!allowed || isPending}
                  onClick={() => {
                    if (!confirm("Delete this profile page?")) return;
                    startTransition(async () => {
                      await deleteProfilePageAction(page.id);
                      router.refresh();
                    });
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!pages.length ? (
            <p className="text-sm text-neutral-600">No additional pages yet.</p>
          ) : null}
        </div>
        <p className="mt-4 text-xs text-neutral-600">
          {pages.length} / {entitlements.max_profile_pages} additional pages used
        </p>
      </div>
    </div>
  );
}
