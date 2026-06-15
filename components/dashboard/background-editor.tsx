"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  removeBackgroundAction,
  saveBackgroundMediaAction,
  updateSettingsAction,
} from "@/app/actions/settings";
import { uploadBackgroundToStorage } from "@/lib/uploads/background-client";
import { BACKGROUND_TYPE_OPTIONS, PARTICLE_OPTIONS } from "@/lib/settings";
import type { BackgroundType, ParticleEffect, ProfileSettings, SettingsFormState } from "@/lib/types/settings";
import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
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

export function BackgroundEditor({ settings }: { settings: ProfileSettings }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRemoving, startRemove] = useTransition();
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initial);
  const [uploadError, setUploadError] = useState<string>();
  const [uploadSuccess, setUploadSuccess] = useState<string>();
  const [uploadPending, setUploadPending] = useState(false);
  useSettingsRefresh(state);

  useEffect(() => {
    if (uploadSuccess) router.refresh();
  }, [uploadSuccess, router]);

  const [backgroundType, setBackgroundType] = useState(settings.background_type);
  const [particleEffect, setParticleEffect] = useState(settings.particle_effect ?? "");
  const [gradientColors, setGradientColors] = useState(settings.gradient_colors.join(", "));

  const hasBackgroundMedia =
    !!settings.background_image_url || !!settings.background_video_url;

  useEffect(() => {
    setBackgroundType(settings.background_type);
    setParticleEffect(settings.particle_effect ?? "");
    setGradientColors(settings.gradient_colors.join(", "));
  }, [settings.updated_at, settings.background_type, settings.particle_effect, settings.gradient_colors]);

  const removeBackground = () => {
    startRemove(async () => {
      await removeBackgroundAction();
      router.refresh();
    });
  };

  const handleBackgroundUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadSuccess(undefined);
      setUploadError("Please select a file.");
      return;
    }

    setUploadPending(true);
    setUploadError(undefined);
    setUploadSuccess(undefined);

    try {
      const { url, isVideo } = await uploadBackgroundToStorage(file);
      const result = await saveBackgroundMediaAction(url, isVideo ? "video" : "image");

      if (result.error) {
        setUploadError(result.error);
        return;
      }

      setUploadSuccess(result.success);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadPending(false);
    }
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
              {settings.background_image_url && (
                <img
                  src={settings.background_image_url}
                  alt="Background preview"
                  className="max-h-32 w-full rounded-lg border border-white/[0.06] object-cover"
                />
              )}
              {settings.background_video_url && (
                <video
                  src={settings.background_video_url}
                  className="max-h-32 w-full rounded-lg border border-white/[0.06] object-cover"
                  muted
                  playsInline
                />
              )}
              <RemoveMediaButton
                label="Remove background"
                disabled={isRemoving}
                onClick={removeBackground}
              />
            </div>
          )}

          <div className="space-y-4">
            <input
              ref={fileInputRef}
              name="background"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
              className="block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#00e5cc] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]"
            />
            <FormFeedback error={uploadError} success={uploadSuccess} />
            <button
              type="button"
              disabled={uploadPending}
              onClick={handleBackgroundUpload}
              className={buttonSecondaryClassName}
            >
              {uploadPending ? "Uploading..." : "Upload file"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function BackgroundPageShell({ settings }: { settings: ProfileSettings }) {
  return <BackgroundEditor settings={settings} />;
}
