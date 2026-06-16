"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignBadgeByUsernameAction,
  createCustomBadgeAction,
  lookupUserBadgesForAdmin,
  removeBadgeAssignmentAction,
} from "@/app/actions/badges";
import { BadgeChip } from "@/components/badges/badge-ui";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  cardClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-fields";
import { BADGE_RARITIES, type Badge, type BadgeFormState, type ProfileBadge } from "@/lib/types/badge";

const initial: BadgeFormState = {};

type LookupProfile = { id: string; username: string; display_name: string | null };

export function BadgesAdminPanel({ catalog }: { catalog: Badge[] }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [lookupError, setLookupError] = useState<string>();
  const [lookupProfile, setLookupProfile] = useState<LookupProfile | null>(null);
  const [userBadges, setUserBadges] = useState<ProfileBadge[]>([]);
  const [isLookingUp, startLookup] = useTransition();
  const [isRemoving, startRemove] = useTransition();

  const [assignState, assignAction, assignPending] = useActionState(assignBadgeByUsernameAction, initial);
  const [createState, createAction, createPending] = useActionState(createCustomBadgeAction, initial);

  const assignableBadges = catalog.filter(
    (b) => b.is_assignable && b.category !== "custom",
  );

  const refreshLookup = (targetUsername: string) => {
    startLookup(async () => {
      const result = await lookupUserBadgesForAdmin(targetUsername);
      if (result.error) {
        setLookupError(result.error);
        setLookupProfile(null);
        setUserBadges([]);
        return;
      }
      setLookupError(undefined);
      setLookupProfile(result.profile ?? null);
      setUserBadges(result.badges ?? []);
    });
  };

  const handleLookup = () => {
    refreshLookup(username);
  };

  const handleRemove = (profileBadgeId: string) => {
    if (!lookupProfile) return;
    startRemove(async () => {
      const result = await removeBadgeAssignmentAction(profileBadgeId);
      if (result.error) {
        setLookupError(result.error);
        return;
      }
      setLookupError(undefined);
      refreshLookup(lookupProfile.username);
      router.refresh();
    });
  };

  useEffect(() => {
    if (!assignState.success || !lookupProfile) return;
    refreshLookup(lookupProfile.username);
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignState.success]);

  useEffect(() => {
    if (!createState.success) return;
    router.refresh();
    const target = username.trim();
    if (target) refreshLookup(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createState.success, router]);

  return (
    <div className={`${cardClassName} border-[#a855f7]/30 bg-[#a855f7]/[0.04]`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-white">Admin — Manage badges</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Look up a user by username, then assign or remove badges.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#a855f7]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#c084fc]">
          Admin
        </span>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="admin-username" className={labelClassName}>Username</label>
          <div className="flex flex-wrap gap-2">
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleLookup())}
              placeholder="bamshy"
              className={`${inputClassName} min-w-[180px] flex-1`}
            />
            <button
              type="button"
              onClick={handleLookup}
              disabled={isLookingUp || !username.trim()}
              className={buttonSecondaryClassName}
            >
              {isLookingUp ? "Loading..." : "Look up user"}
            </button>
          </div>
          {lookupError && <p className="mt-2 text-xs text-red-400">{lookupError}</p>}
        </div>

        {lookupProfile && (
          <>
            <div className="rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-4">
              <p className="text-sm text-white">
                {lookupProfile.display_name || lookupProfile.username}
                <span className="ml-2 text-neutral-500">@{lookupProfile.username}</span>
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                {userBadges.length} badge{userBadges.length === 1 ? "" : "s"} assigned
              </p>

              {userBadges.length === 0 ? (
                <p className="mt-3 text-sm text-neutral-600">No badges assigned yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {userBadges.map((badge) => (
                    <div
                      key={badge.profile_badge_id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-[#141414] p-3"
                    >
                      <BadgeChip badge={badge} />
                      <button
                        type="button"
                        disabled={isRemoving}
                        onClick={() => handleRemove(badge.profile_badge_id)}
                        className="text-xs font-medium text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form action={assignAction} className="rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-4 space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-500">Assign badge</h3>
              <input type="hidden" name="username" value={lookupProfile.username} />
              <div>
                <label htmlFor="badge_slug" className={labelClassName}>Badge</label>
                <select id="badge_slug" name="badge_slug" required className={inputClassName}>
                  <option value="">Select a badge...</option>
                  {assignableBadges.map((badge) => (
                    <option key={badge.id} value={badge.slug}>
                      {badge.name} ({badge.slug})
                    </option>
                  ))}
                </select>
              </div>
              <FormFeedback error={assignState.error} success={assignState.success} />
              <button type="submit" disabled={assignPending} className={buttonPrimaryClassName}>
                {assignPending ? "Assigning..." : "Assign badge"}
              </button>
            </form>
          </>
        )}

        <details className="rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-4">
          <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider text-neutral-500">
            Create custom badge for a user
          </summary>
          <p className="mt-3 text-xs text-neutral-600">
            Custom badges are created for one person only — they are assigned immediately and
            do not appear in the badge list above.
          </p>
          <form
            key={lookupProfile?.username ?? "standalone"}
            action={createAction}
            encType="multipart/form-data"
            className="mt-4 space-y-3"
          >
            <div>
              <label htmlFor="custom-badge-username" className={labelClassName}>Username</label>
              <input
                id="custom-badge-username"
                name="username"
                required
                className={inputClassName}
                placeholder="bamshy"
                defaultValue={lookupProfile?.username ?? ""}
              />
            </div>
            <div>
              <label htmlFor="badge-name" className={labelClassName}>Name</label>
              <input id="badge-name" name="name" required className={inputClassName} placeholder="VIP Member" />
            </div>
            <div>
              <label htmlFor="badge-icon" className={labelClassName}>Badge image</label>
              <input
                id="badge-icon"
                name="icon_image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                required
                className="block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#fafafa] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]"
              />
              <p className="mt-1.5 text-xs text-neutral-600">
                This image is the badge on profiles. PNG, WebP, or SVG recommended. Max 2 MB.
              </p>
            </div>
            <div>
              <label htmlFor="badge-description" className={labelClassName}>Description</label>
              <input id="badge-description" name="description" className={inputClassName} placeholder="Exclusive access" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="badge-color" className={labelClassName}>Color</label>
                <input id="badge-color" name="color" type="color" defaultValue="#fafafa" className="h-10 w-full cursor-pointer rounded-lg border border-white/[0.06] bg-[#141414]" />
              </div>
              <div>
                <label htmlFor="badge-rarity" className={labelClassName}>Rarity</label>
                <select id="badge-rarity" name="rarity" className={inputClassName}>
                  {BADGE_RARITIES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <FormFeedback error={createState.error} success={createState.success} />
            <button type="submit" disabled={createPending} className={buttonSecondaryClassName}>
              {createPending ? "Creating..." : "Create & assign badge"}
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}
