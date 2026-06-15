"use client";

import Link from "next/link";
import { useActionState } from "react";
import { postGuestbookEntryAction, reactGuestbookAction } from "@/app/actions/guestbook";
import { FormFeedback, inputClassName, buttonPrimaryClassName } from "@/components/dashboard/form-fields";
import type { GuestbookEntry, GuestbookFormState } from "@/lib/types/guestbook";
import { GUESTBOOK_EMOJIS } from "@/lib/types/guestbook";
import type { ProfileSettings } from "@/lib/types/settings";

const initial: GuestbookFormState = {};

export function ProfileGuestbookSection({
  profileId,
  settings,
  entries,
  currentUserId,
}: {
  profileId: string;
  settings: ProfileSettings;
  entries: GuestbookEntry[];
  currentUserId?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(postGuestbookEntryAction, initial);

  if (!settings.guestbook_enabled) return null;

  const isOwner = currentUserId === profileId;
  const canSign = !!currentUserId && !isOwner;

  return (
    <div className="mt-8 border-t border-white/[0.06] pt-6">
      <p className="mb-4 text-[10px] font-medium uppercase tracking-wider text-neutral-500">Guestbook</p>

      {canSign && (
        <form action={formAction} className="mb-5 space-y-3">
          <input type="hidden" name="profile_id" value={profileId} />
          <textarea
            name="message"
            rows={3}
            maxLength={500}
            placeholder="Leave a message..."
            className={`${inputClassName} resize-none`}
            required
          />
          <FormFeedback error={state.error} success={state.success} />
          <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
            {isPending ? "Posting..." : "Sign guestbook"}
          </button>
        </form>
      )}

      {!currentUserId && (
        <div className="mb-5 rounded-xl border border-white/[0.06] bg-[#0f0f0f] px-4 py-3 text-sm text-neutral-400">
          <Link href="/login" className="font-medium text-[var(--bf-accent)] transition-colors hover:opacity-90">
            Log in
          </Link>{" "}
          or{" "}
          <Link href="/signup" className="font-medium text-[var(--bf-accent)] transition-colors hover:opacity-90">
            create an account
          </Link>{" "}
          to sign this guestbook.
        </div>
      )}

      {isOwner && (
        <div className="mb-5 rounded-xl border border-white/[0.06] bg-[#0f0f0f] px-4 py-3 text-sm text-neutral-400">
          Visitors can leave messages here. You can approve, delete, or ban users from{" "}
          <Link href="/dashboard/guestbook" className="font-medium text-[var(--bf-accent)] transition-colors hover:opacity-90">
            Dashboard → Guestbook
          </Link>
          .
        </div>
      )}

      <div className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-neutral-600">
            {isOwner
              ? "No messages yet. Share your profile so others can sign."
              : canSign
                ? "No messages yet — be the first to sign above."
                : "No messages yet."}
          </p>
        ) : (
          entries.map((entry) => (
            <GuestbookEntryCard key={entry.id} entry={entry} currentUserId={currentUserId} />
          ))
        )}
      </div>
    </div>
  );
}

function GuestbookEntryCard({
  entry,
  currentUserId,
}: {
  entry: GuestbookEntry;
  currentUserId?: string | null;
}) {
  const name = entry.author?.display_name || entry.author?.username || "User";
  const date = new Date(entry.created_at).toLocaleDateString();

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
      <div className="flex items-start gap-3">
        {entry.author?.avatar_url ? (
          <img src={entry.author.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-neutral-400">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-medium text-white">{name}</p>
            <p className="text-[10px] text-neutral-600">{date}</p>
          </div>
          <p className="mt-1 text-sm text-neutral-300">{entry.message}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {GUESTBOOK_EMOJIS.map((emoji) => {
              const count = entry.reactions?.filter((r) => r.emoji === emoji).length ?? 0;
              const reacted = entry.reactions?.some((r) => r.user_id === currentUserId && r.emoji === emoji);
              return (
                <button
                  key={emoji}
                  type="button"
                  disabled={!currentUserId}
                  onClick={() => currentUserId && reactGuestbookAction(entry.id, emoji)}
                  className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                    reacted ? "bg-[var(--bf-accent)]/15 text-[var(--bf-accent)]" : "bg-white/[0.04] text-neutral-500 hover:text-white"
                  }`}
                >
                  {emoji} {count > 0 && count}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
