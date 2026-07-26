"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import {
  SaveConfirmation,
  useDashboardSettingsSection,
} from "@/components/dashboard/use-settings-form";
import {
  buttonPrimaryClassName,
  cardClassName,
  FormFeedback,
  labelClassName,
  PageHeader,
  RemoveMediaButton,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import {
  removeCursorImageAction,
  removeProfileFaviconAction,
  saveCursorImageAction,
  saveProfileFaviconAction,
} from "@/app/actions/settings";
import { uploadCursorImageToStorage } from "@/lib/uploads/cursor-client";
import { uploadProfileFaviconToStorage } from "@/lib/uploads/favicon-client";
import { IMAGE_CROP_PRESETS } from "@/lib/uploads/image-crop";
import { useImageCropPicker } from "@/hooks/use-image-crop-picker";
import {
  CUSTOM_CURSOR_SIZE_DEFAULT,
  CUSTOM_CURSOR_SIZE_MAX,
  CUSTOM_CURSOR_SIZE_MIN,
} from "@/lib/profile/custom-cursor";
import { CURSOR_EFFECT_OPTIONS, TAB_TITLE_ANIMATION_OPTIONS } from "@/lib/settings";
import type { CursorEffect, ProfileSettings, TabTitleAnimation } from "@/lib/types/settings";
import type { ProfilePage } from "@/lib/profile-pages/slug";

const fileInputClassName =
  "block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#fafafa] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]";

type ContentPageEffectsFormState = {
  cursor_effect: CursorEffect;
  cursor_image_size: number;
  tab_title_animation: TabTitleAnimation;
  hover_animations: boolean;
  page_entrance: boolean;
};

function readContentPageEffectsForm(settings: ProfileSettings): ContentPageEffectsFormState {
  return {
    cursor_effect: settings.cursor_effect,
    cursor_image_size: settings.cursor_image_size,
    tab_title_animation: settings.tab_title_animation,
    hover_animations: settings.hover_animations,
    page_entrance: settings.page_entrance,
  };
}

export function ContentPageEffectsEditor({
  page,
  settings,
  pageId,
}: {
  page: ProfilePage;
  settings: ProfileSettings;
  pageId: string;
}) {
  const router = useRouter();
  const [isRemoving, startRemove] = useTransition();
  const { form, patchForm, submit, state, isPending } = useDashboardSettingsSection(
    "effects",
    settings,
    readContentPageEffectsForm,
    "Page effects saved.",
    undefined,
    pageId,
  );

  const [uploadError, setUploadError] = useState<string>();
  const [uploadSuccess, setUploadSuccess] = useState<string>();
  const [uploadPending, setUploadPending] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [cursorPreview, setCursorPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [faviconUploadError, setFaviconUploadError] = useState<string>();
  const [faviconUploadSuccess, setFaviconUploadSuccess] = useState<string>();
  const [faviconUploadPending, setFaviconUploadPending] = useState(false);
  const [faviconFileInputKey, setFaviconFileInputKey] = useState(0);
  const formRef = useRef(form);
  formRef.current = form;

  const pageTitle = page.label || page.slug;
  const displayCursorUrl = cursorPreview ?? settings.cursor_image_url ?? null;
  const displayFaviconUrl = faviconPreview ?? settings.profile_favicon_url ?? null;

  useEffect(() => {
    setCursorPreview(null);
  }, [settings.cursor_image_url]);

  useEffect(() => {
    setFaviconPreview(null);
  }, [settings.profile_favicon_url]);

  useEffect(() => {
    return () => {
      if (cursorPreview?.startsWith("blob:")) URL.revokeObjectURL(cursorPreview);
    };
  }, [cursorPreview]);

  useEffect(() => {
    return () => {
      if (faviconPreview?.startsWith("blob:")) URL.revokeObjectURL(faviconPreview);
    };
  }, [faviconPreview]);

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    submit(formRef.current);
  };

  const handleCursorUpload = useCallback(async (file: File | undefined) => {
    if (!file) return;

    setUploadPending(true);
    setUploadError(undefined);
    setUploadSuccess(undefined);

    const previewUrl = URL.createObjectURL(file);
    setCursorPreview(previewUrl);

    try {
      const url = await uploadCursorImageToStorage(file);
      const result = await saveCursorImageAction(url, pageId);
      if (result.error) {
        setUploadError(result.error);
        setCursorPreview(null);
        return;
      }
      setUploadSuccess(result.success ?? "Custom cursor uploaded.");
      router.refresh();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
      setCursorPreview(null);
    } finally {
      setUploadPending(false);
      setFileInputKey((k) => k + 1);
    }
  }, [pageId, router]);

  const handleRemoveCursor = () => {
    startRemove(async () => {
      setUploadError(undefined);
      setUploadSuccess(undefined);
      const result = await removeCursorImageAction(pageId);
      if (result.error) {
        setUploadError(result.error);
        return;
      }
      setCursorPreview(null);
      setUploadSuccess(result.success ?? "Custom cursor removed.");
      router.refresh();
    });
  };

  const handleFaviconUpload = useCallback(async (file: File | undefined) => {
    if (!file) return;

    setFaviconUploadPending(true);
    setFaviconUploadError(undefined);
    setFaviconUploadSuccess(undefined);

    const previewUrl = URL.createObjectURL(file);
    setFaviconPreview(previewUrl);

    try {
      const url = await uploadProfileFaviconToStorage(file);
      const result = await saveProfileFaviconAction(url, pageId);
      if (result.error) {
        setFaviconUploadError(result.error);
        setFaviconPreview(null);
        return;
      }
      setFaviconUploadSuccess(result.success ?? "Page favicon uploaded.");
      router.refresh();
    } catch (error) {
      setFaviconUploadError(error instanceof Error ? error.message : "Upload failed.");
      setFaviconPreview(null);
    } finally {
      setFaviconUploadPending(false);
      setFaviconFileInputKey((k) => k + 1);
    }
  }, [pageId, router]);

  const cursorCrop = useImageCropPicker({
    ...IMAGE_CROP_PRESETS.cursor,
    onCropped: (file) => void handleCursorUpload(file),
  });

  const faviconCrop = useImageCropPicker({
    ...IMAGE_CROP_PRESETS.favicon,
    title: "Crop page favicon",
    onCropped: (file) => void handleFaviconUpload(file),
  });

  const handleRemoveFavicon = () => {
    startRemove(async () => {
      setFaviconUploadError(undefined);
      setFaviconUploadSuccess(undefined);
      const result = await removeProfileFaviconAction(pageId);
      if (result.error) {
        setFaviconUploadError(result.error);
        return;
      }
      setFaviconPreview(null);
      setFaviconUploadSuccess(result.success ?? "Page favicon removed.");
      router.refresh();
    });
  };

  return (
    <>
      <PageHeader
        title="Effects"
        description="Browser tab branding, cursor effects, and subtle motion for this page."
      />
      <div className={cardClassName}>
        <form onSubmit={handleSave} data-dashboard-primary-form className="space-y-5">
          <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
            <p className="text-sm font-semibold text-white">Browser tab</p>
            <p className="mt-1 text-xs text-neutral-500">
              What visitors see in their tab when this page is open.
            </p>

            <div className="mt-4">
              <p className={labelClassName}>Tab favicon</p>
              {displayFaviconUrl ? (
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.08] bg-[#141414] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={displayFaviconUrl} alt="Page favicon preview" className="h-full w-full object-contain" />
                  </div>
                  <RemoveMediaButton
                    label="Remove favicon"
                    onClick={handleRemoveFavicon}
                    disabled={isRemoving || faviconUploadPending}
                  />
                </div>
              ) : (
                <p className="mt-3 text-xs text-neutral-500">No custom favicon yet.</p>
              )}

              <div className="mt-4">
                <input
                  key={faviconFileInputKey}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,.ico"
                  disabled={faviconUploadPending}
                  className={fileInputClassName}
                  onChange={(event) => faviconCrop.open(event.target.files?.[0])}
                />
              </div>
              <FormFeedback error={faviconUploadError} success={faviconUploadSuccess} />
            </div>

            <div className="mt-5 border-t border-white/[0.06] pt-5">
              <ControlledSelect
                label="Tab title animation"
                value={form.tab_title_animation}
                onChange={(value) => patchForm({ tab_title_animation: value as TabTitleAnimation })}
                options={TAB_TITLE_ANIMATION_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <p className="mt-2 text-xs text-neutral-500">
                Animates the tab title (e.g. {pageTitle} — cried.bio).
              </p>
            </div>
          </div>

          <ControlledSelect
            label="Cursor effect"
            value={form.cursor_effect}
            onChange={(value) => patchForm({ cursor_effect: value as CursorEffect })}
            options={CURSOR_EFFECT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          />

          <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
            <p className={labelClassName}>Custom cursor image</p>
            {displayCursorUrl ? (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-white/[0.08] bg-[#141414]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayCursorUrl}
                    alt="Custom cursor preview"
                    className="object-contain"
                    style={{
                      maxWidth: form.cursor_image_size,
                      maxHeight: form.cursor_image_size,
                    }}
                  />
                </div>
                <RemoveMediaButton
                  label="Remove cursor"
                  onClick={handleRemoveCursor}
                  disabled={isRemoving || uploadPending}
                />
              </div>
            ) : (
              <p className="mt-3 text-xs text-neutral-500">No custom cursor uploaded yet.</p>
            )}

            {displayCursorUrl ? (
              <div className="mt-4">
                <SliderField
                  name="cursor_image_size"
                  label="Cursor size"
                  min={CUSTOM_CURSOR_SIZE_MIN}
                  max={CUSTOM_CURSOR_SIZE_MAX}
                  value={form.cursor_image_size}
                  onChange={(cursor_image_size) => patchForm({ cursor_image_size })}
                  unit="px"
                />
                <p className="mt-1 text-xs text-neutral-600">
                  Default is {CUSTOM_CURSOR_SIZE_DEFAULT}px.
                </p>
              </div>
            ) : null}

            <div className="mt-4">
              <input
                key={fileInputKey}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploadPending}
                className={fileInputClassName}
                onChange={(event) => cursorCrop.open(event.target.files?.[0])}
              />
            </div>
            <FormFeedback error={uploadError} success={uploadSuccess} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              name="hover_animations"
              label="Link hover animations"
              checked={form.hover_animations}
              onCheckedChange={(hover_animations) => patchForm({ hover_animations })}
            />
            <ToggleField
              name="page_entrance"
              label="Page entrance animation"
              checked={form.page_entrance}
              onCheckedChange={(page_entrance) => patchForm({ page_entrance })}
            />
          </div>

          <SaveConfirmation success={state.success} error={state.error} />
          <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
            {isPending ? "Saving..." : "Save page effects"}
          </button>
        </form>
      </div>
      {cursorCrop.dialog}
      {faviconCrop.dialog}
    </>
  );
}
