"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  removeProfileImageAction,
  saveProfileImageAction,
  updateProfileAction,
} from "@/app/actions/profile";
import { BioStyleEditor } from "@/components/dashboard/bio-style-editor";
import type { Profile, ProfileFormState } from "@/lib/types/profile";
import type { ProfileSettings } from "@/lib/types/settings";
import { uploadProfileImageToStorage } from "@/lib/uploads/profile-client";
import {
  buttonPrimaryClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
  RemoveMediaButton,
} from "@/components/dashboard/form-fields";
import { useClearUnsavedOnSuccess } from "@/components/dashboard/unsaved-changes";
import { SITE_HOST } from "@/lib/site";

const initialState: ProfileFormState = {};

const fileInputClassName =
  "block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#fafafa] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]";

export function ProfileEditor({
  profile,
  settings,
}: {
  profile: Profile | null;
  settings?: ProfileSettings;
}) {
  const router = useRouter();
  const [isRemoving, startRemove] = useTransition();
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);
  const [bioPreview, setBioPreview] = useState(profile?.bio ?? "");

  const [avatarInputKey, setAvatarInputKey] = useState(0);
  const [bannerInputKey, setBannerInputKey] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState<ProfileFormState>({});
  const [bannerFeedback, setBannerFeedback] = useState<ProfileFormState>({});

  useClearUnsavedOnSuccess(state);
  useClearUnsavedOnSuccess(avatarFeedback);
  useClearUnsavedOnSuccess(bannerFeedback);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
      if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    };
  }, [avatarPreview, bannerPreview]);

  useEffect(() => {
    setAvatarPreview(null);
    setBannerPreview(null);
  }, [profile?.avatar_url, profile?.banner_url]);

  useEffect(() => {
    setBioPreview(profile?.bio ?? "");
  }, [profile?.bio]);

  const handleImageUpload = async (type: "avatar" | "banner", file: File | undefined) => {
    if (!file) return;

    const setUploading = type === "avatar" ? setAvatarUploading : setBannerUploading;
    const setFeedback = type === "avatar" ? setAvatarFeedback : setBannerFeedback;
    const setPreview = type === "avatar" ? setAvatarPreview : setBannerPreview;
    const bumpInputKey = type === "avatar" ? setAvatarInputKey : setBannerInputKey;

    setUploading(true);
    setFeedback({});

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const url = await uploadProfileImageToStorage(file, type);
      const result = await saveProfileImageAction(type, url);

      if (result.error) {
        setFeedback({ error: result.error });
        setPreview(null);
        return;
      }

      setFeedback({ success: result.success });
      router.refresh();
    } catch (error) {
      setFeedback({
        error: error instanceof Error ? error.message : "Image upload failed.",
      });
      setPreview(null);
    } finally {
      setUploading(false);
      bumpInputKey((key) => key + 1);
    }
  };

  const removeImage = (type: "avatar" | "banner") => {
    startRemove(async () => {
      const result = await removeProfileImageAction(type);
      if (type === "avatar") {
        setAvatarFeedback(result);
        setAvatarPreview(null);
        setAvatarInputKey((key) => key + 1);
      } else {
        setBannerFeedback(result);
        setBannerPreview(null);
        setBannerInputKey((key) => key + 1);
      }
      router.refresh();
    });
  };

  const avatarDisplayUrl = avatarPreview ?? profile?.avatar_url ?? null;
  const bannerDisplayUrl = bannerPreview ?? profile?.banner_url ?? null;

  return (
    <form action={formAction} data-dashboard-primary-form className="space-y-6">
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
          onChange={(event) => setBioPreview(event.target.value)}
          placeholder="Tell the world about yourself..."
          className={`${inputClassName} resize-none`}
        />
      </div>

      {settings ? (
        <BioStyleEditor settings={settings} bioPreview={bioPreview} embedded />
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="avatar" className={labelClassName}>Avatar Image</label>
          {avatarDisplayUrl ? (
            <div className="mb-3">
              <img
                src={avatarDisplayUrl}
                alt="Current avatar"
                className="h-20 w-20 rounded-full border border-white/[0.06] object-cover"
              />
              <div className="mt-2">
                <RemoveMediaButton
                  label="Remove avatar"
                  disabled={isRemoving || avatarUploading}
                  onClick={() => removeImage("avatar")}
                />
              </div>
            </div>
          ) : (
            <p className="mb-3 text-xs text-neutral-600">No avatar uploaded.</p>
          )}
          <input
            key={avatarInputKey}
            id="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={avatarUploading}
            onChange={(event) => {
              void handleImageUpload("avatar", event.target.files?.[0]);
            }}
            className={fileInputClassName}
          />
          <p className="mt-1.5 text-xs text-neutral-600">
            {avatarUploading ? "Uploading avatar..." : "Choose a file to upload or replace your avatar."}
          </p>
          <FormFeedback error={avatarFeedback.error} success={avatarFeedback.success} />
        </div>

        <div>
          <label htmlFor="banner" className={labelClassName}>Banner Image</label>
          {bannerDisplayUrl ? (
            <div className="mb-3">
              <img
                src={bannerDisplayUrl}
                alt="Current banner"
                className="h-20 w-full rounded-lg border border-white/[0.06] object-cover"
              />
              <div className="mt-2">
                <RemoveMediaButton
                  label="Remove banner"
                  disabled={isRemoving || bannerUploading}
                  onClick={() => removeImage("banner")}
                />
              </div>
            </div>
          ) : (
            <p className="mb-3 text-xs text-neutral-600">No banner uploaded.</p>
          )}
          <input
            key={bannerInputKey}
            type="file"
            id="banner"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={bannerUploading}
            onChange={(event) => {
              void handleImageUpload("banner", event.target.files?.[0]);
            }}
            className={fileInputClassName}
          />
          <p className="mt-1.5 text-xs text-neutral-600">
            {bannerUploading ? "Uploading banner..." : "Choose a file to upload or replace your banner."}
          </p>
          <FormFeedback error={bannerFeedback.error} success={bannerFeedback.success} />
        </div>
      </div>

      <FormFeedback error={state.error} success={state.success} />

      <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
        {isPending ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
