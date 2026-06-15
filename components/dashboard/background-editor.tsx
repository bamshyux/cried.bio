"use client";

import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import {
  SaveConfirmation,
  useSettingsForm,
  useSyncedSettingsState,
} from "@/components/dashboard/use-settings-form";
import {
  buttonPrimaryClassName,
  cardClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
  PageHeader,
  RemoveMediaButton,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import {
  removeBackgroundAction,
  saveBackgroundMediaAction,
} from "@/app/actions/settings";
import { uploadBackgroundToStorage } from "@/lib/uploads/background-client";
import { MAX_BACKGROUND_UPLOAD_LABEL } from "@/lib/uploads/limits";
import { BACKGROUND_TYPE_OPTIONS, PARTICLE_OPTIONS } from "@/lib/settings";
import type { BackgroundType, ParticleEffect, ProfileSettings } from "@/lib/types/settings";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const fileInputClassName =
  "block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#fafafa] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]";

type BackgroundFormState = {
  backgroundType: BackgroundType;
  particleEffect: ParticleEffect | "";
  gradientColors: string;
  backgroundColor: string;
  animatedGradient: boolean;
  overlayOpacity: number;
  vignette: boolean;
  noiseTexture: boolean;
};

function readBackgroundForm(settings: ProfileSettings): BackgroundFormState {
  return {
    backgroundType: settings.background_type,
    particleEffect: settings.particle_effect ?? "",
    gradientColors: settings.gradient_colors.join(", "),
    backgroundColor: settings.background_color,
    animatedGradient: settings.animated_gradient,
    overlayOpacity: settings.overlay_opacity,
    vignette: settings.vignette,
    noiseTexture: settings.noise_texture,
  };
}

export function BackgroundEditor({ settings }: { settings: ProfileSettings }) {
  const router = useRouter();
  const [isRemoving, startRemove] = useTransition();
  const { state, submit, isPending } = useSettingsForm("background", "Background saved.");
  const [form, setForm] = useSyncedSettingsState(settings.updated_at, readBackgroundForm(settings));

  const [uploadError, setUploadError] = useState<string>();
  const [uploadSuccess, setUploadSuccess] = useState<string>();
  const [uploadPending, setUploadPending] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const patchForm = useCallback(
    (partial: Partial<BackgroundFormState>) => setForm((prev) => ({ ...prev, ...partial })),
    [setForm],
  );

  useEffect(() => {
    setImagePreview(null);
    setVideoPreview(null);
  }, [settings.background_image_url, settings.background_video_url]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
      if (videoPreview?.startsWith("blob:")) URL.revokeObjectURL(videoPreview);
    };
  }, [imagePreview, videoPreview]);

  const displayImageUrl = imagePreview ?? settings.background_image_url ?? null;
  const displayVideoUrl = videoPreview ?? settings.background_video_url ?? null;
  const hasBackgroundMedia = !!displayImageUrl || !!displayVideoUrl;

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    submit({
      background_type: form.backgroundType,
      background_color: form.backgroundColor,
      gradient_colors: form.gradientColors,
      animated_gradient: form.animatedGradient,
      particle_effect: form.particleEffect,
      overlay_opacity: form.overlayOpacity,
      vignette: form.vignette,
      noise_texture: form.noiseTexture,
    });
  };

  const handleBackgroundUpload = async (file: File | undefined) => {
    if (!file) return;

    setUploadPending(true);
    setUploadError(undefined);
    setUploadSuccess(undefined);

    const isVideo = file.type === "video/mp4";
    if (isVideo) {
      setVideoPreview(URL.createObjectURL(file));
      setImagePreview(null);
    } else {
      setImagePreview(URL.createObjectURL(file));
      setVideoPreview(null);
    }

    try {
      const { url, isVideo: uploadedVideo } = await uploadBackgroundToStorage(file);
      const result = await saveBackgroundMediaAction(url, uploadedVideo ? "video" : "image");

      if (result.error) {
        setUploadError(result.error);
        setImagePreview(null);
        setVideoPreview(null);
        return;
      }

      setUploadSuccess(result.success);
      if (uploadedVideo) {
        patchForm({ backgroundType: "video" });
      } else {
        patchForm({ backgroundType: "image" });
      }
      router.refresh();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
      setImagePreview(null);
      setVideoPreview(null);
    } finally {
      setUploadPending(false);
      setFileInputKey((key) => key + 1);
    }
  };

  const removeBackground = () => {
    startRemove(async () => {
      const result = await removeBackgroundAction();
      if (!result.error) {
        setImagePreview(null);
        setVideoPreview(null);
        setUploadError(undefined);
        setUploadSuccess(result.success);
        setFileInputKey((key) => key + 1);
        router.refresh();
      } else {
        setUploadError(result.error);
      }
    });
  };

  return (
    <>
      <PageHeader title="Background" description="Images, video, gradients, particles, and overlay controls." />
      <div className="space-y-6">
        <div className={cardClassName}>
          <form
            onSubmit={handleSave}
            data-dashboard-primary-form
            className="space-y-5"
          >
            <ControlledSelect
              label="Background type"
              value={form.backgroundType}
              onChange={(v) => patchForm({ backgroundType: v as BackgroundType })}
              options={BACKGROUND_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />

            <div>
              <label htmlFor="background_color" className={labelClassName}>
                Solid color
              </label>
              <input
                id="background_color"
                type="color"
                value={form.backgroundColor.startsWith("#") ? form.backgroundColor : "#050508"}
                onChange={(e) => patchForm({ backgroundColor: e.target.value })}
                className="h-10 w-full cursor-pointer rounded-lg border border-white/[0.06] bg-[#090909]"
              />
            </div>

            <div>
              <label htmlFor="gradient_colors" className={labelClassName}>
                Gradient colors (comma-separated hex)
              </label>
              <input
                id="gradient_colors"
                type="text"
                value={form.gradientColors}
                onChange={(e) => patchForm({ gradientColors: e.target.value })}
                placeholder="#090909, #141414, #1a1a1a"
                className={inputClassName}
              />
            </div>

            <ToggleField
              key={`animated-${form.animatedGradient}`}
              name="animated_gradient"
              label="Animate gradient"
              defaultChecked={form.animatedGradient}
              onCheckedChange={(animatedGradient) => patchForm({ animatedGradient })}
            />

            <ControlledSelect
              label="Particle effect"
              value={form.particleEffect}
              onChange={(v) => patchForm({ particleEffect: v as ParticleEffect | "" })}
              options={[
                { value: "", label: "None" },
                ...PARTICLE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
              ]}
            />

            <div>
              <label htmlFor="overlay_opacity" className={labelClassName}>
                Overlay opacity: <span className="text-[var(--bf-accent)]">{form.overlayOpacity}%</span>
              </label>
              <input
                id="overlay_opacity"
                type="range"
                min={0}
                max={100}
                value={form.overlayOpacity}
                onChange={(e) => patchForm({ overlayOpacity: Number(e.target.value) })}
                className="w-full accent-[#5865F2]"
              />
            </div>

            <ToggleField
              key={`vignette-${form.vignette}`}
              name="vignette"
              label="Vignette"
              description="Darkened edges"
              defaultChecked={form.vignette}
              onCheckedChange={(vignette) => patchForm({ vignette })}
            />
            <ToggleField
              key={`noise-${form.noiseTexture}`}
              name="noise_texture"
              label="Noise texture"
              description="Subtle film grain"
              defaultChecked={form.noiseTexture}
              onCheckedChange={(noiseTexture) => patchForm({ noiseTexture })}
            />

            <SaveConfirmation success={state.success} error={state.error} />
            <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
              {isPending ? "Saving..." : "Save background"}
            </button>
          </form>
        </div>

        <div className={cardClassName}>
          <h2 className="mb-4 text-sm font-medium text-white">Upload background</h2>

          {hasBackgroundMedia && (
            <div className="mb-4 space-y-3 border-b border-white/[0.06] pb-4">
              <p className="text-xs text-neutral-500">Current background</p>
              {displayImageUrl && (
                <img
                  src={displayImageUrl}
                  alt="Background preview"
                  className="max-h-32 w-full rounded-lg border border-white/[0.06] object-cover"
                />
              )}
              {displayVideoUrl && (
                <video
                  src={displayVideoUrl}
                  className="max-h-32 w-full rounded-lg border border-white/[0.06] object-cover"
                  muted
                  playsInline
                />
              )}
              <RemoveMediaButton
                label="Remove background"
                disabled={isRemoving || uploadPending}
                onClick={removeBackground}
              />
            </div>
          )}

          <div className="space-y-3">
            <input
              key={fileInputKey}
              id="background"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
              disabled={uploadPending}
              onChange={(event) => {
                void handleBackgroundUpload(event.target.files?.[0]);
              }}
              className={fileInputClassName}
            />
            <p className="text-xs text-neutral-600">
              {uploadPending
                ? "Uploading background..."
                : `JPEG, PNG, WebP, GIF, or MP4 — max ${MAX_BACKGROUND_UPLOAD_LABEL}.`}
            </p>
            <FormFeedback error={uploadError} success={uploadSuccess} />
          </div>
        </div>
      </div>
    </>
  );
}

export function BackgroundPageShell({ settings }: { settings: ProfileSettings }) {
  return <BackgroundEditor settings={settings} />;
}
