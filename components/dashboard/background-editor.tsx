"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  removeBackgroundAction,
  saveBackgroundMediaAction,
  updateSettingsAction,
} from "@/app/actions/settings";
import { uploadBackgroundToStorage } from "@/lib/uploads/background-client";
import { MAX_BACKGROUND_UPLOAD_LABEL } from "@/lib/uploads/limits";
import { BACKGROUND_TYPE_OPTIONS, PARTICLE_OPTIONS } from "@/lib/settings";
import type { BackgroundType, ParticleEffect, ProfileSettings, SettingsFormState } from "@/lib/types/settings";
import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import {
  buttonPrimaryClassName,
  cardClassName,
  ColorField,
  FormFeedback,
  inputClassName,
  labelClassName,
  PageHeader,
  RemoveMediaButton,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { useSettingsRefresh } from "@/components/dashboard/use-settings-refresh";

const initial: SettingsFormState = {};

const fileInputClassName =
  "block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#fafafa] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]";

export function BackgroundEditor({ settings }: { settings: ProfileSettings }) {
  const router = useRouter();
  const [isRemoving, startRemove] = useTransition();
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initial);
  const [uploadError, setUploadError] = useState<string>();
  const [uploadSuccess, setUploadSuccess] = useState<string>();
  const [uploadPending, setUploadPending] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  useSettingsRefresh(state);

  const [backgroundType, setBackgroundType] = useState(settings.background_type);
  const [particleEffect, setParticleEffect] = useState(settings.particle_effect ?? "");
  const [gradientColors, setGradientColors] = useState(settings.gradient_colors.join(", "));

  useEffect(() => {
    setBackgroundType(settings.background_type);
    setParticleEffect(settings.particle_effect ?? "");
    setGradientColors(settings.gradient_colors.join(", "));
  }, [settings.updated_at, settings.background_type, settings.particle_effect, settings.gradient_colors]);

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
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="_section" value="background" />

            <ControlledSelect
              name="background_type"
              label="Background type"
              value={backgroundType}
              onChange={(v) => setBackgroundType(v as BackgroundType)}
              options={BACKGROUND_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />

            <ColorField name="background_color" label="Solid color" defaultValue={settings.background_color} />

            <div>
              <label htmlFor="gradient_colors" className={labelClassName}>Gradient colors (comma-separated hex)</label>
              <input
                id="gradient_colors"
                name="gradient_colors"
                type="text"
                value={gradientColors}
                onChange={(e) => setGradientColors(e.target.value)}
                placeholder="#090909, #141414, #1a1a1a"
                className={inputClassName}
              />
            </div>

            <ToggleField name="animated_gradient" label="Animate gradient" defaultChecked={settings.animated_gradient} />

            <ControlledSelect
              name="particle_effect"
              label="Particle effect"
              value={particleEffect}
              onChange={(v) => setParticleEffect(v as ParticleEffect | "")}
              options={[
                { value: "", label: "None" },
                ...PARTICLE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
              ]}
            />

            <SliderField name="overlay_opacity" label="Overlay opacity" min={0} max={100} defaultValue={settings.overlay_opacity} unit="%" />
            <ToggleField name="vignette" label="Vignette" description="Darkened edges" defaultChecked={settings.vignette} />
            <ToggleField name="noise_texture" label="Noise texture" description="Subtle film grain" defaultChecked={settings.noise_texture} />

            <FormFeedback error={state.error} success={state.success} />
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
