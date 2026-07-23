"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfilePageIdentityAction } from "@/app/actions/profile-pages";
import {
  buttonPrimaryClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
  PageHeader,
  RemoveMediaButton,
} from "@/components/dashboard/form-fields";
import { uploadProfileImageToStorage } from "@/lib/uploads/profile-client";
import type { ProfilePage } from "@/lib/profile-pages/slug";
import { SITE_HOST } from "@/lib/site";

const fileInputClassName =
  "block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#fafafa] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]";

export function ProfilePageIdentityEditor({
  page,
  username,
}: {
  page: ProfilePage;
  username: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>();
  const [label, setLabel] = useState(page.label);
  const [displayName, setDisplayName] = useState(page.display_name);
  const [bio, setBio] = useState(page.bio);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  useEffect(() => {
    setLabel(page.label);
    setDisplayName(page.display_name);
    setBio(page.bio);
  }, [page.label, page.display_name, page.bio]);

  const saveIdentity = (patch: Parameters<typeof updateProfilePageIdentityAction>[1]) => {
    startTransition(async () => {
      const result = await updateProfilePageIdentityAction(page.id, patch);
      setFeedback(result);
      if (!result.error) router.refresh();
    });
  };

  const handleImageUpload = async (type: "avatar" | "banner", file: File | undefined) => {
    if (!file) return;

    const setUploading = type === "avatar" ? setAvatarUploading : setBannerUploading;
    setUploading(true);
    setFeedback({});

    try {
      const url = await uploadProfileImageToStorage(file, type);
      saveIdentity(type === "avatar" ? { avatar_url: url } : { banner_url: url });
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    saveIdentity({ label, display_name: displayName, bio });
  };

  return (
    <>
      <PageHeader
        title="Page identity"
        description="Display name, bio, avatar, and banner for this profile page only."
      />

      <div className="mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-neutral-500">
        Public URL:{" "}
        <span className="text-neutral-300">
          {SITE_HOST}/{username}/{page.slug}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="page-label" className={labelClassName}>
            Dashboard label
          </label>
          <input
            id="page-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputClassName}
            placeholder="Gaming"
          />
          <p className="mt-1.5 text-xs text-neutral-600">Only shown in your dashboard, not on the public page.</p>
        </div>

        <div>
          <label htmlFor="page-display-name" className={labelClassName}>
            Display name
          </label>
          <input
            id="page-display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClassName}
            placeholder="Your page name"
          />
        </div>

        <div>
          <label htmlFor="page-bio" className={labelClassName}>
            Bio
          </label>
          <textarea
            id="page-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className={inputClassName}
            placeholder="Tell visitors about this page..."
          />
        </div>

        <FormFeedback {...feedback} />

        <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
          {isPending ? "Saving…" : "Save identity"}
        </button>
      </form>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <label className={labelClassName}>Avatar</label>
          {page.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.avatar_url} alt="" className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <p className="text-sm text-neutral-600">No avatar uploaded for this page.</p>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={avatarUploading || isPending}
            onChange={(e) => void handleImageUpload("avatar", e.target.files?.[0])}
            className={fileInputClassName}
          />
          {page.avatar_url ? (
            <RemoveMediaButton
              label="Remove avatar"
              disabled={avatarUploading || isPending}
              onClick={() => saveIdentity({ avatar_url: null })}
            />
          ) : null}
        </div>

        <div className="space-y-3">
          <label className={labelClassName}>Banner</label>
          {page.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.banner_url} alt="" className="h-24 w-full rounded-xl object-cover" />
          ) : (
            <p className="text-sm text-neutral-600">No banner uploaded for this page.</p>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={bannerUploading || isPending}
            onChange={(e) => void handleImageUpload("banner", e.target.files?.[0])}
            className={fileInputClassName}
          />
          {page.banner_url ? (
            <RemoveMediaButton
              label="Remove banner"
              disabled={bannerUploading || isPending}
              onClick={() => saveIdentity({ banner_url: null })}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
