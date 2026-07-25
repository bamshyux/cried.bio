"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { createPurchasedBadgeAction } from "@/app/actions/store-badge-creation";
import {
  buttonPrimaryClassName,
  cardClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-fields";
import type { StoreBadgeCredit } from "@/lib/store/badge-credits";
import type { BadgeFormState } from "@/lib/types/badge";
import { readJsonResponse } from "@/lib/stripe/client-fetch";

const initial: BadgeFormState = {};

type BadgeCreationClientProps = {
  route: "static" | "static-pack" | "animated";
  credit: StoreBadgeCredit;
  title: string;
  description: string;
  accept: string;
  uploadHint: string;
};

export function BadgeCreationClient({
  route,
  credit,
  title,
  description,
  accept,
  uploadHint,
}: BadgeCreationClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [syncing, setSyncing] = useState(Boolean(sessionId));
  const [syncError, setSyncError] = useState<string>();
  const [state, formAction, pending] = useActionState(createPurchasedBadgeAction, initial);

  const slotNumber = credit.slots_used + 1;
  const slotsRemaining = credit.slots_total - credit.slots_used;

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/stripe/sync-store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await readJsonResponse<{ error?: string }>(res);
        if (!res.ok) throw new Error(data.error ?? "Could not confirm purchase.");
        if (!cancelled) router.refresh();
      } catch (error) {
        if (!cancelled) {
          setSyncError(error instanceof Error ? error.message : "Could not confirm purchase.");
        }
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  useEffect(() => {
    if (!state.success) return;
    router.refresh();
  }, [state.success, router]);

  const completed =
    state.success && (route !== "static-pack" || slotNumber >= credit.slots_total);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link
          href="/dashboard/store"
          className="text-sm text-neutral-500 transition-colors hover:text-neutral-300"
        >
          ← Back to Store
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">{description}</p>
        {route === "static-pack" ? (
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-violet-300/90">
            Badge {slotNumber} of {credit.slots_total} · {slotsRemaining} remaining
          </p>
        ) : null}
        {route === "static" || route === "static-pack" ? (
          <p className="mt-2 text-xs text-neutral-500">Rarity is locked to Mythic for store badges.</p>
        ) : null}
      </div>

      {syncing ? (
        <div className={`${cardClassName} mb-6 text-sm text-neutral-400`}>Confirming your purchase…</div>
      ) : null}

      {syncError ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {syncError}
        </div>
      ) : null}

      {completed ? (
        <div className={`${cardClassName} space-y-4`}>
          <FormFeedback state={state} />
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/badges" className={buttonPrimaryClassName}>
              View your badges
            </Link>
            <Link
              href="/dashboard/store"
              className="rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm text-neutral-300 transition-colors hover:border-white/[0.18] hover:text-white"
            >
              Back to Store
            </Link>
          </div>
        </div>
      ) : (
        <form action={formAction} className={`${cardClassName} space-y-5`}>
          <input type="hidden" name="route" value={route} />
          <FormFeedback state={state} />

          <div>
            <label htmlFor="badge-name" className={labelClassName}>
              Badge name
            </label>
            <input
              id="badge-name"
              name="name"
              type="text"
              required
              maxLength={48}
              placeholder="My Custom Badge"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="badge-description" className={labelClassName}>
              Badge bio
            </label>
            <textarea
              id="badge-description"
              name="description"
              rows={3}
              maxLength={280}
              placeholder="A short description shown on your profile."
              className={`${inputClassName} min-h-[96px] resize-y`}
            />
          </div>

          <div>
            <label htmlFor="badge-image" className={labelClassName}>
              Badge image
            </label>
            <input
              id="badge-image"
              name="icon_image"
              type="file"
              required
              accept={accept}
              className="block w-full text-sm text-neutral-400 file:mr-4 file:rounded-lg file:border-0 file:bg-white/[0.08] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/[0.12]"
            />
            <p className="mt-2 text-xs text-neutral-500">{uploadHint}</p>
          </div>

          <button type="submit" disabled={pending || syncing} className={buttonPrimaryClassName}>
            {pending ? "Creating…" : route === "static-pack" ? `Create badge ${slotNumber}` : "Create badge"}
          </button>
        </form>
      )}
    </div>
  );
}
