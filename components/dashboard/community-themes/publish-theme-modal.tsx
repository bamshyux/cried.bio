"use client";

import { useState, useTransition } from "react";
import { publishCommunityThemeAction } from "@/app/actions/community-themes";
import {
  buttonPrimaryClassName,
  cardClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-fields";
import type { CustomTheme } from "@/lib/types/custom-theme";
import {
  COMMUNITY_THEME_CATEGORIES,
  COMMUNITY_THEME_VISIBILITY_OPTIONS,
  type CommunityThemeCategory,
  type CommunityThemeListing,
  type CommunityThemeVisibility,
} from "@/lib/types/community-theme";

export function PublishThemeModal({
  theme,
  existingListing,
  onClose,
  onPublished,
}: {
  theme: CustomTheme;
  existingListing?: Pick<
    CommunityThemeListing,
    "id" | "title" | "description" | "tags" | "category" | "visibility" | "preview_image_url"
  > | null;
  onClose: () => void;
  onPublished: () => void;
}) {
  const [title, setTitle] = useState(existingListing?.title ?? theme.name);
  const [description, setDescription] = useState(existingListing?.description ?? "");
  const [tags, setTags] = useState((existingListing?.tags ?? []).join(", "));
  const [category, setCategory] = useState<CommunityThemeCategory>(
    existingListing?.category ?? "other",
  );
  const [visibility, setVisibility] = useState<CommunityThemeVisibility>(
    existingListing?.visibility ?? "public",
  );
  const [previewImageUrl, setPreviewImageUrl] = useState(existingListing?.preview_image_url ?? "");
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await publishCommunityThemeAction({
        themeId: theme.id,
        title,
        description,
        tags,
        category,
        visibility,
        previewImageUrl: previewImageUrl || undefined,
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
              {existingListing ? "Update Published Theme" : "Publish Theme"}
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Share <span className="text-neutral-300">{theme.name}</span> with the community.
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
            <label htmlFor="publish_title" className={labelClassName}>Theme Name</label>
            <input
              id="publish_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClassName}
              placeholder="Neon Pulse"
            />
          </div>

          <div>
            <label htmlFor="publish_description" className={labelClassName}>Description</label>
            <textarea
              id="publish_description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClassName} min-h-[88px]`}
              placeholder="A dark neon theme with glowing accents..."
            />
          </div>

          <div>
            <label htmlFor="publish_tags" className={labelClassName}>Tags</label>
            <input
              id="publish_tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={inputClassName}
              placeholder="neon, dark, minimal"
            />
            <p className="mt-1 text-[11px] text-neutral-600">Comma-separated, up to 8 tags.</p>
          </div>

          <div>
            <label htmlFor="publish_category" className={labelClassName}>Category</label>
            <select
              id="publish_category"
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
            <label htmlFor="publish_preview" className={labelClassName}>Preview Image URL (optional)</label>
            <input
              id="publish_preview"
              value={previewImageUrl}
              onChange={(e) => setPreviewImageUrl(e.target.value)}
              className={inputClassName}
              placeholder="https://..."
            />
          </div>

          <fieldset className="space-y-2">
            <legend className={labelClassName}>Visibility</legend>
            {COMMUNITY_THEME_VISIBILITY_OPTIONS.map((option) => (
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
                  name="visibility"
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
            {isPending ? "Publishing..." : existingListing ? "Save changes" : "Publish Theme"}
          </button>
        </div>
      </div>
    </div>
  );
}
