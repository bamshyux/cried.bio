"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createEmbedAction,
  deleteEmbedAction,
  reorderEmbedsAction,
  toggleEmbedAction,
} from "@/app/actions/embeds";
import {
  buttonPrimaryClassName,
  cardClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
  PageHeader,
} from "@/components/dashboard/form-fields";
import { EMBED_TYPE_OPTIONS, type EmbedFormState, type ProfileEmbed } from "@/lib/types/embed";

const initial: EmbedFormState = {};

export function EmbedsEditor({ embeds: initialEmbeds }: { embeds: ProfileEmbed[] }) {
  const router = useRouter();
  const [embeds, setEmbeds] = useState(initialEmbeds);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [state, formAction, isPending] = useActionState(createEmbedAction, initial);
  const [isPendingAction, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    setEmbeds(initialEmbeds);
  }, [initialEmbeds]);

  useEffect(() => {
    if (state.success) {
      setFormKey((key) => key + 1);
      router.refresh();
    }
  }, [state.success, router]);

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      return;
    }
    const reordered = [...embeds];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setEmbeds(reordered);
    setDragIndex(null);
    startTransition(async () => {
      await reorderEmbedsAction(reordered.map((e) => e.id));
      router.refresh();
    });
  };

  const handleToggle = (embedId: string, visible: boolean) => {
    setEmbeds((current) =>
      current.map((embed) => (embed.id === embedId ? { ...embed, is_visible: visible } : embed)),
    );
    startTransition(async () => {
      await toggleEmbedAction(embedId, visible);
      router.refresh();
    });
  };

  const handleDelete = (embedId: string) => {
    setEmbeds((current) => current.filter((embed) => embed.id !== embedId));
    startTransition(async () => {
      await deleteEmbedAction(embedId);
      router.refresh();
    });
  };

  return (
    <>
      <PageHeader title="Embeds" description="Add YouTube, Twitch, Spotify, and more to your profile." />
      <div className={`${cardClassName} mb-6`}>
        <form key={formKey} action={formAction} className="space-y-4">
          <div>
            <label htmlFor="url" className={labelClassName}>Paste embed URL</label>
            <input id="url" name="url" type="url" placeholder="https://youtube.com/watch?v=..." className={inputClassName} required />
          </div>
          <p className="text-xs text-neutral-600">
            Supported: {EMBED_TYPE_OPTIONS.map((e) => e.label).join(", ")}
          </p>
          <FormFeedback error={state.error} success={state.success} />
          <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
            {isPending ? "Adding..." : "Add embed"}
          </button>
        </form>
      </div>

      {embeds.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-white">Your embeds ({embeds.length})</h2>
          <div className="space-y-2">
            {embeds.map((embed, index) => (
              <div
                key={embed.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                className={`flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4 ${dragIndex === index ? "opacity-40" : ""}`}
              >
                <span className="cursor-grab select-none text-neutral-600" aria-hidden>⠿</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{embed.title}</p>
                  <p className="truncate text-xs text-neutral-500">{embed.embed_type} · {embed.url}</p>
                </div>
                <button
                  type="button"
                  disabled={isPendingAction}
                  onClick={() => handleToggle(embed.id, !embed.is_visible)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium ${
                    embed.is_visible ? "bg-[#00e5cc]/10 text-[#00e5cc]" : "bg-white/[0.04] text-neutral-500"
                  }`}
                >
                  {embed.is_visible ? "Visible" : "Hidden"}
                </button>
                <button
                  type="button"
                  disabled={isPendingAction}
                  onClick={() => handleDelete(embed.id)}
                  className="rounded-lg border border-red-500/20 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          {isPendingAction && <p className="text-xs text-neutral-600">Saving...</p>}
        </div>
      ) : (
        <p className="text-sm text-neutral-600">No embeds yet. Add one above to show it on your profile.</p>
      )}
    </>
  );
}
