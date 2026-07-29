"use client";

import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import {
  EnterGateEditor,
  readEnterGateForm,
  type EnterGateFormFields,
} from "@/components/dashboard/enter-gate-editor";
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
import { removeCursorImageAction, removeProfileFaviconAction, saveCursorHotspotAction, saveCursorImageAction, saveProfileFaviconAction } from "@/app/actions/settings";
import { uploadCursorImageToStorage } from "@/lib/uploads/cursor-client";
import { uploadProfileFaviconToStorage } from "@/lib/uploads/favicon-client";
import { IMAGE_CROP_PRESETS } from "@/lib/uploads/image-crop";
import { useCursorImagePicker, useCursorHotspotEditor } from "@/hooks/use-cursor-image-picker";
import { useImageCropPicker } from "@/hooks/use-image-crop-picker";
import {
  CUSTOM_CURSOR_SIZE_DEFAULT,
  CUSTOM_CURSOR_SIZE_MAX,
  CUSTOM_CURSOR_SIZE_MIN,
  type CursorHotspot,
} from "@/lib/profile/custom-cursor";
import { CURSOR_EFFECT_OPTIONS, TAB_TITLE_ANIMATION_OPTIONS, USERNAME_EFFECT_OPTIONS } from "@/lib/settings";
import { PAGE_ENTRANCE_ANIMATION_OPTIONS } from "@/lib/page-entrance";
import type { CursorEffect, PageEntranceAnimation, ProfileSettings, TabTitleAnimation, UsernameEffect } from "@/lib/types/settings";
import type { Profile } from "@/lib/types/profile";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const fileInputClassName =
  "block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#fafafa] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]";

type EffectsFormState = EnterGateFormFields & {
  cursor_effect: CursorEffect;
  cursor_image_size: number;
  cursor_hotspot_x: number;
  cursor_hotspot_y: number;
  tab_title_animation: TabTitleAnimation;
  username_effect: UsernameEffect;
  typing_bio: boolean;
  hover_animations: boolean;
  page_entrance_animation: PageEntranceAnimation;
};

function readEffectsForm(settings: ProfileSettings): EffectsFormState {
  return {
    ...readEnterGateForm(settings),
    cursor_effect: settings.cursor_effect,
    cursor_image_size: settings.cursor_image_size,
    cursor_hotspot_x: settings.cursor_hotspot_x,
    cursor_hotspot_y: settings.cursor_hotspot_y,
    tab_title_animation: settings.tab_title_animation,
    username_effect: settings.username_effect,
    typing_bio: settings.typing_bio,
    hover_animations: settings.hover_animations,
    page_entrance_animation: settings.page_entrance_animation,
  };
}

export function EffectsEditor({
  settings,
  profile,
  pageId,
  hideEnterGate = false,
}: {
  settings: ProfileSettings;
  profile: Profile;
  pageId?: string;
  hideEnterGate?: boolean;
}) {
  const router = useRouter();
  const [isRemoving, startRemove] = useTransition();
  const { form, patchForm, submit, state, isPending } = useDashboardSettingsSection(
    "effects",
    settings,
    readEffectsForm,
    "Effects saved.",
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

  const displayCursorUrl = cursorPreview ?? settings.cursor_image_url ?? null;
  const displayFaviconUrl = faviconPreview ?? settings.profile_favicon_url ?? null;

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const current = formRef.current;
    submit({
      ...current,
      enter_gate_font_family: current.enter_gate_use_profile_font ? "" : current.enter_gate_font_family,
    });
  };

  const handleCursorUpload = useCallback(
    async (file: File | undefined, hotspot?: CursorHotspot) => {
      if (!file) return;

      setUploadPending(true);
      setUploadError(undefined);
      setUploadSuccess(undefined);

      const previewUrl = URL.createObjectURL(file);
      setCursorPreview(previewUrl);

      try {
        const url = await uploadCursorImageToStorage(file);
        const result = await saveCursorImageAction(url, pageId, hotspot);
        if (result.error) {
          setUploadError(result.error);
          setCursorPreview(null);
          return;
        }
        if (hotspot) {
          patchForm({
            cursor_hotspot_x: hotspot.x,
            cursor_hotspot_y: hotspot.y,
          });
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
    },
    [pageId, patchForm, router],
  );

  const handleHotspotSave = useCallback(
    async (hotspot: CursorHotspot) => {
      setUploadError(undefined);
      setUploadSuccess(undefined);
      setUploadPending(true);

      try {
        const result = await saveCursorHotspotAction(hotspot.x, hotspot.y, pageId);
        if (result.error) {
          setUploadError(result.error);
          return;
        }
        patchForm({
          cursor_hotspot_x: hotspot.x,
          cursor_hotspot_y: hotspot.y,
        });
        setUploadSuccess(result.success ?? "Cursor click point updated.");
        router.refresh();
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Could not save click point.");
      } finally {
        setUploadPending(false);
      }
    },
    [pageId, patchForm, router],
  );

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
      setFaviconUploadSuccess(result.success ?? "Profile favicon uploaded.");
      router.refresh();
    } catch (error) {
      setFaviconUploadError(error instanceof Error ? error.message : "Upload failed.");
      setFaviconPreview(null);
    } finally {
      setFaviconUploadPending(false);
      setFaviconFileInputKey((k) => k + 1);
    }
  }, [pageId, router]);

  const cursorPicker = useCursorImagePicker({
    initialHotspot: {
      x: form.cursor_hotspot_x,
      y: form.cursor_hotspot_y,
    },
    onComplete: (file, hotspot) => void handleCursorUpload(file, hotspot),
  });

  const hotspotEditor = useCursorHotspotEditor({
    onConfirm: (hotspot) => void handleHotspotSave(hotspot),
  });

  const faviconCrop = useImageCropPicker({
    ...IMAGE_CROP_PRESETS.favicon,
    onCropped: (file) => void handleFaviconUpload(file),
  });

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
      setFaviconUploadSuccess(result.success ?? "Profile favicon removed.");
      router.refresh();
    });
  };

  return (
    <>
      <PageHeader title="Effects" description="Cursor, browser tab branding, username, bio, page entrance animation, and click-to-enter screen." />
      <div className={cardClassName} data-tour="tour-effects">
        <form onSubmit={handleSave} data-dashboard-primary-form className="space-y-5">
          <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
            <p className="text-sm font-semibold text-white">Browser tab</p>
            <p className="mt-1 text-xs text-neutral-500">
              Customize what visitors see in their browser tab on your profile link only.
            </p>

            <div className="mt-4">
              <p className={labelClassName}>Profile favicon</p>
              <p className="mt-1 text-xs text-neutral-500">
                Replaces the default cried.bio icon in the tab when someone opens your profile.
              </p>

              {displayFaviconUrl ? (
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.08] bg-[#141414] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={displayFaviconUrl} alt="Profile favicon preview" className="h-full w-full object-contain" />
                  </div>
                  <RemoveMediaButton
                    label="Remove favicon"
                    onClick={handleRemoveFavicon}
                    disabled={isRemoving || faviconUploadPending}
                  />
                </div>
              ) : (
                <p className="mt-3 text-xs text-neutral-500">No custom favicon uploaded yet.</p>
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
                <p className="mt-2 text-xs text-neutral-500">
                  {faviconUploadPending ? "Uploading..." : "ICO, PNG, JPEG, WebP, or GIF up to 512 KB."}
                </p>
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
                Animates your tab title (e.g. {profile.display_name || profile.username} — cried.bio). Try Typewriter for a back-and-forth typing effect.
              </p>
            </div>
          </div>

          {!hideEnterGate ? (
            <EnterGateEditor
              settings={settings}
              profile={profile}
              form={form}
              patchForm={patchForm}
            />
          ) : null}

          <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
            <ControlledSelect
              label="Page entrance animation"
              value={form.page_entrance_animation}
              onChange={(value) =>
                patchForm({ page_entrance_animation: value as PageEntranceAnimation })
              }
              options={PAGE_ENTRANCE_ANIMATION_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
            <p className="mt-2 text-xs text-neutral-500">
              {PAGE_ENTRANCE_ANIMATION_OPTIONS.find((option) => option.value === form.page_entrance_animation)?.description ??
                "Plays when visitors enter your profile after the click-to-enter screen."}
            </p>
          </div>

          <ControlledSelect
            label="Cursor effect"
            value={form.cursor_effect}
            onChange={(v) => patchForm({ cursor_effect: v as CursorEffect })}
            options={CURSOR_EFFECT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          <div className="rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
            <p className={labelClassName}>Custom cursor image</p>
            <p className="mt-1 text-xs text-neutral-500">
              Upload an image visitors will see as their cursor on your profile. Works alongside cursor effects.
              Square PNG or GIF works best.
            </p>

            {displayCursorUrl ? (
              <div className="mt-4 flex flex-wrap items-center gap-4">
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
                <div className="flex flex-col items-start gap-2">
                  <RemoveMediaButton
                    label="Remove cursor"
                    onClick={handleRemoveCursor}
                    disabled={isRemoving || uploadPending}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      hotspotEditor.open(displayCursorUrl, {
                        x: form.cursor_hotspot_x,
                        y: form.cursor_hotspot_y,
                      })
                    }
                    disabled={uploadPending}
                    className="text-left text-xs font-medium text-neutral-400 transition-colors hover:text-white disabled:opacity-50"
                  >
                    Adjust click point
                  </button>
                  <p className="text-xs text-neutral-600">
                    Click point at {form.cursor_hotspot_x}% / {form.cursor_hotspot_y}%
                  </p>
                </div>
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
                  Default is {CUSTOM_CURSOR_SIZE_DEFAULT}px. Drag to make your cursor smaller or larger on your profile.
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
                onChange={(event) => cursorPicker.open(event.target.files?.[0])}
              />
              <p className="mt-2 text-xs text-neutral-500">
                {uploadPending
                  ? "Uploading..."
                  : "JPEG, PNG, WebP, or GIF up to 2 MB. After cropping, you will set the click point."}
              </p>
            </div>
            <FormFeedback error={uploadError} success={uploadSuccess} />
          </div>

          <ControlledSelect
            label="Username effect"
            value={form.username_effect}
            onChange={(v) => patchForm({ username_effect: v as UsernameEffect })}
            options={USERNAME_EFFECT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              name="typing_bio"
              label="Typing bio"
              description="Bio types out, pauses, then backspaces in a loop"
              checked={form.typing_bio}
              onCheckedChange={(typing_bio) => patchForm({ typing_bio })}
            />
            <ToggleField
              name="hover_animations"
              label="Hover animations"
              checked={form.hover_animations}
              onCheckedChange={(hover_animations) => patchForm({ hover_animations })}
            />
          </div>

          <input type="hidden" name="cursor_hotspot_x" value={form.cursor_hotspot_x} />
          <input type="hidden" name="cursor_hotspot_y" value={form.cursor_hotspot_y} />

          <SaveConfirmation success={state.success} error={state.error} />
          <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
            {isPending ? "Saving..." : "Save effects"}
          </button>
        </form>
      </div>
      {cursorPicker.dialog}
      {hotspotEditor.dialog}
      {faviconCrop.dialog}
    </>
  );
}

export function EffectsPageShell({
  settings,
  profile,
  pageId,
  hideEnterGate = false,
}: {
  settings: ProfileSettings;
  profile: Profile;
  pageId?: string;
  hideEnterGate?: boolean;
}) {
  return (
    <EffectsEditor
      settings={settings}
      profile={profile}
      pageId={pageId}
      hideEnterGate={hideEnterGate}
    />
  );
}
