"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { saveCurrentProfilePresetAction } from "@/app/actions/profile-presets";
import { ImportPresetModal } from "@/components/dashboard/profile-presets/import-preset-modal";
import { PresetCard } from "@/components/dashboard/profile-presets/preset-card";
import {
  buttonSecondaryClassName,
  cardClassName,
  FormFeedback,
  PageHeader,
} from "@/components/dashboard/form-fields";
import { IconPresets } from "@/components/icons/dashboard-icons";
import { useUnsavedChangesOptional } from "@/components/dashboard/unsaved-changes";
import {
  parseImportedPresetJson,
  presetNameFromFilename,
  resolveImportedPresetName,
  type ImportedPresetMeta,
} from "@/lib/profile-presets/import";
import type { CommunityThemeListing } from "@/lib/types/community-theme";
import type { ProfileBadge } from "@/lib/types/badge";
import type { ProfilePreset } from "@/lib/types/profile-preset";
import { MAX_PROFILE_PRESETS } from "@/lib/types/profile-preset";
import type { ProfilePresetData } from "@/lib/types/profile-preset";

const INVALID_PRESET_FILE_ERROR = "This preset file is invalid or unsupported.";

type ImportDraft = {
  data: ProfilePresetData;
  meta: ImportedPresetMeta;
};

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeId, setActiveId] = useState(activePresetId);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});
  const [importDraft, setImportDraft] = useState<ImportDraft | null>(null);
  const [dragActive, setDragActive] = useState(false);
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

  const processImportFile = useCallback(
    (file: File) => {
      setFeedback({});

      if (initialPresets.length >= MAX_PROFILE_PRESETS) {
        setFeedback({ error: `Maximum ${MAX_PROFILE_PRESETS} presets allowed.` });
        return;
      }

      if (!file.name.toLowerCase().endsWith(".json")) {
        setFeedback({ error: INVALID_PRESET_FILE_ERROR });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        const fallbackName = presetNameFromFilename(file.name);
        const parsed = parseImportedPresetJson(text, fallbackName);

        if (!parsed) {
          setFeedback({ error: INVALID_PRESET_FILE_ERROR });
          return;
        }

        const resolvedName = resolveImportedPresetName(
          parsed.meta.name,
          initialPresets.map((preset) => preset.name),
        );
        setImportDraft({
          data: parsed.data,
          meta: { ...parsed.meta, name: resolvedName },
        });
      };
      reader.onerror = () => {
        setFeedback({ error: INVALID_PRESET_FILE_ERROR });
      };
      reader.readAsText(file);
    },
    [initialPresets],
  );

  function handleImportInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    processImportFile(file);
  }

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);

      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      processImportFile(file);
    },
    [processImportFile],
  );

  return (
    <div
      className={`space-y-8 ${dragActive ? "relative" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragActive ? (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
          <div className="rounded-2xl border border-dashed border-white/25 bg-[#111]/90 px-8 py-6 text-center">
            <p className="text-sm font-medium text-white">Drop preset JSON to import</p>
            <p className="mt-1 text-xs text-neutral-500">.json files exported from cried.bio</p>
          </div>
        </div>
      ) : null}

      <PageHeader
        title="My Presets"
        description="Save complete profile styles — layout, colors, links, widgets, music, and more — then switch between them instantly."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`${cardClassName} flex flex-col gap-5 lg:col-span-2`}>
          <div className="flex items-start gap-4">
            <span className="inline-flex shrink-0 rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-3 text-neutral-400">
              <IconPresets size={20} />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white">Save current profile</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-500">
                Capture everything that affects how your profile looks right now. Presets are
                separate from Custom Themes, which only store CSS.
              </p>
            </div>
          </div>

          <div className="space-y-3 border-t border-white/[0.06] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-neutral-600">
                {initialPresets.length}/{MAX_PROFILE_PRESETS} presets saved
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isPending || initialPresets.length >= MAX_PROFILE_PRESETS}
                  onClick={handleSaveCurrentProfile}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:border-white/[0.16] hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {isPending ? "Saving..." : "Save preset"}
                </button>
                <button
                  type="button"
                  disabled={isPending || initialPresets.length >= MAX_PROFILE_PRESETS}
                  onClick={() => fileInputRef.current?.click()}
                  className={`${buttonSecondaryClassName} inline-flex shrink-0 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  Import JSON
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImportInputChange}
                />
              </div>
            </div>
            <p className="text-xs text-neutral-600">
              Import a preset exported from cried.bio (.json)
            </p>
          </div>
        </div>

        <div className={`${cardClassName} flex flex-col justify-between gap-4`}>
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
            Style your profile, then click Save preset to create your first one.
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

      {importDraft ? (
        <ImportPresetModal
          presetData={importDraft.data}
          meta={importDraft.meta}
          onClose={() => setImportDraft(null)}
          onImported={() => {
            setFeedback({ success: `"${importDraft.meta.name}" imported.` });
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}
