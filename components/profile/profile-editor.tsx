"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeProfileImageAction, updateProfileAction } from "@/app/actions/profile";
import type { Profile, ProfileFormState } from "@/lib/types/profile";
import {
  buttonPrimaryClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
  RemoveMediaButton,
} from "@/components/dashboard/form-fields";
import { SITE_HOST } from "@/lib/site";

const initialState: ProfileFormState = {};

export function ProfileEditor({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const [isRemoving, startRemove] = useTransition();
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);

  const removeImage = (type: "avatar" | "banner") => {
    startRemove(async () => {
      await removeProfileImageAction(type);
      router.refresh();
    });
  };

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <label htmlFor="username" className={labelClassName}>Username</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">{SITE_HOST}/</span>
            <input
              id="username"
              name="username"
              type="text"
              required
              defaultValue={profile?.username ?? ""}
              placeholder="yourname"
              pattern="[a-z0-9_]{3,20}"
              className={inputClassName}
            />
          </div>
          <p className="mt-1.5 text-xs text-neutral-500">
            Lowercase letters, numbers, and underscores only.
          </p>
        </div>

        <div>
          <label htmlFor="displayName" className={labelClassName}>Display Name</label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            defaultValue={profile?.display_name ?? ""}
            placeholder="Your Name"
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <label htmlFor="bio" className={labelClassName}>Bio</label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile?.bio ?? ""}
          placeholder="Tell the world about yourself..."
          className={`${inputClassName} resize-none`}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="avatar" className={labelClassName}>Avatar Image</label>
          {profile?.avatar_url ? (
            <div className="mb-3">
              <img
                src={profile.avatar_url}
                alt="Current avatar"
                className="h-20 w-20 rounded-full border border-white/[0.06] object-cover"
              />
              <div className="mt-2">
                <RemoveMediaButton
                  label="Remove avatar"
                  disabled={isRemoving}
                  onClick={() => removeImage("avatar")}
                />
              </div>
            </div>
          ) : (
            <p className="mb-3 text-xs text-neutral-600">No avatar uploaded.</p>
          )}
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#00e5cc] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]"
          />
        </div>

        <div>
          <label htmlFor="banner" className={labelClassName}>Banner Image</label>
          {profile?.banner_url ? (
            <div className="mb-3">
              <img
                src={profile.banner_url}
                alt="Current banner"
                className="h-20 w-full rounded-lg border border-white/[0.06] object-cover"
              />
              <div className="mt-2">
                <RemoveMediaButton
                  label="Remove banner"
                  disabled={isRemoving}
                  onClick={() => removeImage("banner")}
                />
              </div>
            </div>
          ) : (
            <p className="mb-3 text-xs text-neutral-600">No banner uploaded.</p>
          )}
          <input
            id="banner"
            name="banner"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#00e5cc] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]"
          />
        </div>
      </div>

      <FormFeedback error={state.error} success={state.success} />

      <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
        {isPending ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
