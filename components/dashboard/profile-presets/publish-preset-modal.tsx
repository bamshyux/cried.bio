"use client";

import { useState, useTransition } from "react";
import { publishCommunityProfilePresetAction } from "@/app/actions/community-themes";
import {
  buttonPrimaryClassName,
  cardClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-fields";
import type { ProfilePreset } from "@/lib/types/profile-preset";
import {
  COMMUNITY_THEME_CATEGORIES,
  type CommunityThemeCategory,
  type CommunityThemeListing,
  type CommunityThemeVisibility,
} from "@/lib/types/community-theme";

const PRESET_VISIBILITY_OPTIONS = [
  {
    id: "private" as const,
    label: "Private",
    description: "Only you can see it. Not listed in Community Themes.",
  },
  {
    id: "public" as const,
    label: "Public",
    description: "Listed in Community Themes. Others can install the full profile preset.",
  },
];

export function PublishPresetModal({
  preset,
  existingListing,
  onClose,
  onPublished,
}: {
  preset: ProfilePreset;
  existingListing?: Pick<
    CommunityThemeListing,
    "id" | "title" | "description" | "tags" | "category" | "visibility" | "preview_image_url"
  > | null;
  onClose: () => void;
  onPublished: () => void;
}) {
  const [title, setTitle] = useState(existingListing?.title ?? preset.name);
  const [description, setDescription] = useState(existingListing?.description ?? "");
  const [tags, setTags] = useState((existingListing?.tags ?? []).join(", "));
  const [category, setCategory] = useState<CommunityThemeCategory>(
    existingListing?.category ?? "other",
  );
  const [visibility, setVisibility] = useState<CommunityThemeVisibility>(
    existingListing?.visibility === "open_source" ? "public" : (existingListing?.visibility ?? "public"),
  );
  const [previewImageUrl, setPreviewImageUrl] = useState(existingListing?.preview_image_url ?? "");
  const [refreshSnapshot, setRefreshSnapshot] = useState(!existingListing);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await publishCommunityProfilePresetAction({
        presetId: preset.id,
        title,
        description,
        tags,
        category,
        visibility,
        previewImageUrl: previewImageUrl || undefined,
        refreshSnapshot: existingListing ? refreshSnapshot : true,
      });
      setFeedback(result.error ? { error: result.error } : { success: result.success });
      if (!result.error) {
        onPublished();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className={`${cardClassName} bf-explore-page max-h-[90vh] w-full max-w-xl overflow-y-auto`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {existingListing ? "Update Shared Preset" : "Share Preset"}
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Publish <span className="text-neutral-300">{preset.name}</span> to Community Themes so
              others can install your full profile look.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] px-2 py-1 text-xs text-neutral-400 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="preset_publish_title" className={labelClassName}>
              Listing name
            </label>
            <input
              id="preset_publish_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClassName}
              placeholder="Neon gaming preset"
            />
          </div>

          <div>
            <label htmlFor="preset_publish_description" className={labelClassName}>
              Description
            </label>
            <textarea
              id="preset_publish_description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClassName} min-h-[88px]`}
              placeholder="Dark layout with purple accents, Discord widget, and curated links..."
            />
          </div>

          <div>
            <label htmlFor="preset_publish_tags" className={labelClassName}>
              Tags
            </label>
            <input
              id="preset_publish_tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={inputClassName}
              placeholder="gaming, dark, minimal"
            />
          </div>

          <div>
            <label htmlFor="preset_publish_category" className={labelClassName}>
              Category
            </label>
            <select
              id="preset_publish_category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CommunityThemeCategory)}
              className={inputClassName}
            >
              {COMMUNITY_THEME_CATEGORIES.filter((item) => item.id !== "all").map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="preset_publish_preview" className={labelClassName}>
              Preview image URL (optional)
            </label>
            <input
              id="preset_publish_preview"
              value={previewImageUrl}
              onChange={(e) => setPreviewImageUrl(e.target.value)}
              className={inputClassName}
              placeholder="https://..."
            />
          </div>

          {existingListing ? (
            <label className="flex cursor-pointer gap-3 rounded-xl border border-white/[0.06] p-3">
              <input
                type="checkbox"
                checked={refreshSnapshot}
                onChange={(e) => setRefreshSnapshot(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-white">
                  Update public look from saved preset
                </span>
                <span className="mt-0.5 block text-xs text-neutral-500">
                  Freezes whatever is currently saved in your preset library — background, music,
                  guestbook styling, and layout. Your live profile changes won&apos;t affect this
                  listing unless you check this after updating the preset itself.
                </span>
              </span>
            </label>
          ) : null}

          <fieldset className="space-y-2">
            <legend className={labelClassName}>Visibility</legend>
            {PRESET_VISIBILITY_OPTIONS.map((option) => (
              <label
                key={option.id}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                  visibility === option.id
                    ? "border-white/[0.18] bg-white/[0.06]"
                    : "border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <input
                  type="radio"
                  name="preset_visibility"
                  value={option.id}
                  checked={visibility === option.id}
                  onChange={() => setVisibility(option.id)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-white">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-neutral-500">{option.description}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </div>

        <FormFeedback error={feedback.error} success={feedback.success} />

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-neutral-400"
          >
            Cancel
          </button>
          <button type="button" disabled={isPending} onClick={handleSubmit} className={buttonPrimaryClassName}>
            {isPending ? "Publishing..." : existingListing ? "Save changes" : "Share preset"}
          </button>
        </div>
      </div>
    </div>
  );
}
