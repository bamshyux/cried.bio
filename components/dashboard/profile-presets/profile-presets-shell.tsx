"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { saveCurrentProfilePresetAction } from "@/app/actions/profile-presets";
import { PresetCard } from "@/components/dashboard/profile-presets/preset-card";
import {
  buttonPrimaryClassName,
  cardClassName,
  FormFeedback,
  PageHeader,
} from "@/components/dashboard/form-fields";
import { useUnsavedChangesOptional } from "@/components/dashboard/unsaved-changes";
import type { CommunityThemeListing } from "@/lib/types/community-theme";
import type { ProfileBadge } from "@/lib/types/badge";
import type { ProfilePreset } from "@/lib/types/profile-preset";
import { MAX_PROFILE_PRESETS } from "@/lib/types/profile-preset";

export function ProfilePresetsShell({
  presets: initialPresets,
  activePresetId,
  presetListings = {},
  username = "user",
  badges = [],
}: {
  presets: ProfilePreset[];
  activePresetId: string | null;
  presetListings?: Record<
    string,
    Pick<
      CommunityThemeListing,
      "id" | "title" | "description" | "tags" | "category" | "visibility" | "preview_image_url"
    >
  >;
  username?: string;
  badges?: ProfileBadge[];
}) {
  const router = useRouter();
  const unsaved = useUnsavedChangesOptional();
  const [activeId, setActiveId] = useState(activePresetId);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setActiveId(activePresetId);
  }, [activePresetId]);

  const checkUnsavedBeforeApply = useCallback(() => {
    if (!unsaved?.isDirty) return true;

    return window.confirm(
      "You have unsaved changes on another dashboard page. Apply this preset anyway? Your unsaved edits will remain in the editor until you save or reset them.",
    );
  }, [unsaved?.isDirty]);

  function refresh() {
    router.refresh();
  }

  function handleApplied(presetId: string) {
    setActiveId(presetId);
    unsaved?.markClean();
    refresh();
  }

  function handleSaveCurrentProfile() {
    if (initialPresets.length >= MAX_PROFILE_PRESETS) {
      setFeedback({ error: `Maximum ${MAX_PROFILE_PRESETS} presets allowed.` });
      return;
    }

    const name = window.prompt("Name this preset");
    if (name === null) return;

    const presetName = name.trim();
    if (!presetName) {
      setFeedback({ error: "Preset name is required." });
      return;
    }

    startTransition(async () => {
      setFeedback({});
      const result = await saveCurrentProfilePresetAction(presetName);
      setFeedback(result);
      if (result.error) return;
      if (result.presetId) setActiveId(result.presetId);
      refresh();
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Presets"
        description="Save complete profile styles — layout, colors, links, widgets, music, and more — then switch between them instantly."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`${cardClassName} flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between`}>
          <div>
            <h2 className="text-base font-semibold text-white">Save current profile</h2>
            <p className="mt-1 max-w-xl text-sm text-neutral-500">
              Capture everything that affects how your profile looks right now. Presets are separate
              from Custom Themes, which only store CSS.
            </p>
            <p className="mt-2 text-xs text-neutral-600">
              {initialPresets.length}/{MAX_PROFILE_PRESETS} presets saved
            </p>
          </div>
          <button
            type="button"
            disabled={isPending || initialPresets.length >= MAX_PROFILE_PRESETS}
            onClick={handleSaveCurrentProfile}
            className={buttonPrimaryClassName}
          >
            {isPending ? "Saving..." : "Save Current Profile"}
          </button>
        </div>

        <div className={`${cardClassName} flex flex-col justify-between gap-3`}>
          <div>
            <h2 className="text-base font-semibold text-white">Community presets</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Browse full profile looks shared by other creators, or share your own presets publicly.
            </p>
          </div>
          <Link
            href="/dashboard/explore/themes?type=profile_preset"
            className="inline-flex w-fit rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-neutral-300 transition hover:border-white/[0.14] hover:text-white"
          >
            Browse community presets →
          </Link>
        </div>
      </div>

      <FormFeedback error={feedback.error} success={feedback.success} />

      {initialPresets.length === 0 ? (
        <div className={`${cardClassName} py-16 text-center`}>
          <p className="text-sm text-neutral-400">No presets yet.</p>
          <p className="mt-2 text-xs text-neutral-600">
            Style your profile, then click Save Current Profile to create your first preset.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {initialPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isActive={activeId === preset.id}
              existingListing={presetListings[preset.id] ?? null}
              username={username}
              badges={badges}
              onApplied={handleApplied}
              onMutated={refresh}
              checkUnsavedBeforeApply={checkUnsavedBeforeApply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
