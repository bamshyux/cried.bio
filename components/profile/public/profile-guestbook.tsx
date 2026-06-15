"use client";

import Link from "next/link";
import { useActionState } from "react";
import { postGuestbookEntryAction } from "@/app/actions/guestbook";
import { FormFeedback } from "@/components/dashboard/form-fields";
import type { GuestbookEntry, GuestbookFormState } from "@/lib/types/guestbook";
import type { ProfileSettings } from "@/lib/types/settings";

const initial: GuestbookFormState = {};
const MAX_VISIBLE_ENTRIES = 6;

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
  const visibleEntries = entries.slice(0, MAX_VISIBLE_ENTRIES);
  const hiddenCount = entries.length - visibleEntries.length;

  return (
    <section className="bf-guestbook mt-10 border-t border-white/[0.04] pt-5">
      <p className="bf-guestbook__label">guestbook</p>

      {visibleEntries.length > 0 ? (
        <ul className="bf-guestbook__entries">
          {visibleEntries.map((entry) => (
            <GuestbookWhisper key={entry.id} entry={entry} />
          ))}
        </ul>
      ) : (
        <p className="bf-guestbook__empty">—</p>
      )}

      {hiddenCount > 0 && (
        <p className="bf-guestbook__more">+{hiddenCount} more</p>
      )}

      {canSign && (
        <form action={formAction} className="bf-guestbook__form">
          <input type="hidden" name="profile_id" value={profileId} />
          <input
            type="text"
            name="message"
            maxLength={500}
            placeholder="leave a note"
            className="bf-guestbook__input"
            required
          />
          <button type="submit" disabled={isPending} className="bf-guestbook__submit">
            {isPending ? "…" : "sign"}
          </button>
          <FormFeedback error={state.error} success={state.success} />
        </form>
      )}

      {!currentUserId && !isOwner && (
        <p className="bf-guestbook__hint">
          <Link href="/login">log in</Link> to sign
        </p>
      )}

      {isOwner && (
        <p className="bf-guestbook__hint">
          <Link href="/dashboard/guestbook">manage</Link>
        </p>
      )}
    </section>
  );
}

function GuestbookWhisper({ entry }: { entry: GuestbookEntry }) {
  const handle = entry.author?.username ? `@${entry.author.username}` : "guest";

  return (
    <li className="bf-guestbook__entry">
      <span className="bf-guestbook__quote">&ldquo;{entry.message}&rdquo;</span>
      <span className="bf-guestbook__by">{handle}</span>
    </li>
  );
}
