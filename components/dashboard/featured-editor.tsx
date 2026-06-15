"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createFeaturedBlockAction,
  deleteFeaturedBlockAction,
  reorderFeaturedBlocksAction,
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
import { FEATURED_BLOCK_OPTIONS, type FeaturedBlock, type FeaturedFormState } from "@/lib/types/featured";

const initial: FeaturedFormState = {};

export function FeaturedEditor({ blocks }: { blocks: FeaturedBlock[] }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createFeaturedBlockAction, initial);
  useClearUnsavedOnSuccess(state);
  const [, startTransition] = useTransition();

  return (
    <>
      <PageHeader title="Featured" description="Pin up to 6 content blocks above your links." />
      <div className={`${cardClassName} mb-6`}>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className={labelClassName}>Title</label>
              <input id="title" name="title" className={inputClassName} required />
            </div>
            <div>
              <label htmlFor="block_type" className={labelClassName}>Type</label>
              <select id="block_type" name="block_type" className={inputClassName} defaultValue="link">
                {FEATURED_BLOCK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
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
          <FormFeedback error={state.error} success={state.success} />
          <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
            {isPending ? "Creating..." : "Add featured block"}
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {blocks.map((block, index) => (
          <div key={block.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">{block.title}</p>
              <p className="text-xs text-neutral-500">{block.block_type} · {block.description || block.url}</p>
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
              onClick={() => deleteFeaturedBlockAction(block.id).then(() => router.refresh())}
              className="text-xs text-red-400"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
