"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createFeaturedBlockAction,
  deleteFeaturedBlockAction,
  toggleFeaturedBlockAction,
} from "@/app/actions/featured";
import {
  buttonPrimaryClassName,
  cardClassName,
  ColorField,
  FormFeedback,
  inputClassName,
  labelClassName,
  PageHeader,
} from "@/components/dashboard/form-fields";
import { useClearUnsavedOnSuccess } from "@/components/dashboard/unsaved-changes";
import {
  FEATURED_BLOCK_OPTIONS,
  type FeaturedBlock,
  type FeaturedBlockType,
  type FeaturedFormState,
} from "@/lib/types/featured";
import { assignFileToInput, IMAGE_CROP_PRESETS } from "@/lib/uploads/image-crop";
import { useImageCropPicker } from "@/hooks/use-image-crop-picker";

const initial: FeaturedFormState = {};

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function FeaturedEditor({ blocks }: { blocks: FeaturedBlock[] }) {
  const router = useRouter();
  const [blockType, setBlockType] = useState<FeaturedBlockType>("link");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(createFeaturedBlockAction, initial);
  useClearUnsavedOnSuccess(state, isPending);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!state.success) return;
    setFormKey((key) => key + 1);
    setBlockType("link");
    setImagePreview(null);
    router.refresh();
  }, [state.success, router]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (file: File | undefined) => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    if (!file) {
      setImagePreview(null);
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    assignFileToInput(imageFileInputRef.current, file);
  };

  const featuredImageCrop = useImageCropPicker({
    ...IMAGE_CROP_PRESETS.featured,
    onCropped: (file) => handleImageChange(file),
  });

  const isImageType = blockType === "image";

  return (
    <>
      <PageHeader title="Featured" description="Pin up to 6 content blocks above your links." />
      <div className={`${cardClassName} mb-6`}>
        <form key={formKey} action={formAction} encType="multipart/form-data" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className={labelClassName}>Title</label>
              <input id="title" name="title" className={inputClassName} required />
            </div>
            <div>
              <label htmlFor="block_type" className={labelClassName}>Type</label>
              <select
                id="block_type"
                name="block_type"
                className={inputClassName}
                value={blockType}
                onChange={(e) => {
                  const next = e.target.value as FeaturedBlockType;
                  setBlockType(next);
                  if (next !== "image") {
                    handleImageChange(undefined);
                  }
                }}
              >
                {FEATURED_BLOCK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {isImageType ? (
            <div className="space-y-4 rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-4">
              <div>
                <label htmlFor="image_file" className={labelClassName}>Upload image</label>
                <input
                  ref={imageFileInputRef}
                  id="image_file"
                  name="image_file"
                  type="file"
                  accept={IMAGE_ACCEPT}
                  onChange={(e) => featuredImageCrop.open(e.target.files?.[0])}
                  className="block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#fafafa] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]"
                />
                <p className="mt-1.5 text-xs text-neutral-600">JPEG, PNG, WebP, or GIF · up to 5 MB</p>
              </div>

              {imagePreview ? (
                <div className="overflow-hidden rounded-lg border border-white/[0.08]">
                  <img src={imagePreview} alt="" className="max-h-48 w-full object-cover" />
                </div>
              ) : null}

              <div>
                <label htmlFor="thumbnail_url" className={labelClassName}>Or paste image URL</label>
                <input
                  id="thumbnail_url"
                  name="thumbnail_url"
                  type="url"
                  placeholder="https://..."
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="url" className={labelClassName}>Link when clicked (optional)</label>
                <input id="url" name="url" type="url" placeholder="https://..." className={inputClassName} />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="description" className={labelClassName}>Description</label>
                <textarea id="description" name="description" rows={2} className={inputClassName} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="url" className={labelClassName}>URL</label>
                  <input id="url" name="url" type="url" className={inputClassName} />
                </div>
                <ColorField name="accent_color" label="Accent color" defaultValue="#fafafa" />
              </div>
              <div>
                <label htmlFor="thumbnail_url" className={labelClassName}>Thumbnail URL (optional)</label>
                <input id="thumbnail_url" name="thumbnail_url" type="url" className={inputClassName} />
              </div>
            </>
          )}

          {isImageType ? (
            <>
              <div>
                <label htmlFor="description" className={labelClassName}>Description (optional)</label>
                <textarea id="description" name="description" rows={2} className={inputClassName} />
              </div>
              <ColorField name="accent_color" label="Accent color" defaultValue="#fafafa" />
            </>
          ) : null}

          <FormFeedback error={state.error} success={state.success} />
          <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
            {isPending ? "Creating..." : "Add featured block"}
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {blocks.map((block) => (
          <div key={block.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
            {block.thumbnail_url ? (
              <img
                src={block.thumbnail_url}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">{block.title}</p>
              <p className="text-xs text-neutral-500">{block.block_type} · {block.description || block.url || "No link"}</p>
            </div>
            <button
              type="button"
              onClick={() => toggleFeaturedBlockAction(block.id, !block.is_enabled).then(() => router.refresh())}
              className="text-xs text-neutral-400"
            >
              {block.is_enabled ? "Enabled" : "Disabled"}
            </button>
            <button
              type="button"
              onClick={() => {
                startTransition(async () => {
                  await deleteFeaturedBlockAction(block.id);
                  router.refresh();
                });
              }}
              className="text-xs text-red-400"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      {featuredImageCrop.dialog}
    </>
  );
}
