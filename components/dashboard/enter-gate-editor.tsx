"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import {
  FormFeedback,
  inputClassName,
  labelClassName,
  RemoveMediaButton,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import {
  removeEnterGateMediaAction,
  saveEnterGateMediaAction,
} from "@/app/actions/settings";
import { ProfileEnterGate } from "@/components/profile/public/profile-enter-gate";
import {
  ENTER_GATE_ANIMATION_OPTIONS,
  ENTER_GATE_BACKGROUND_OPTIONS,
  ENTER_GATE_BUTTON_STYLE_OPTIONS,
  ENTER_GATE_TEXT_ALIGN_OPTIONS,
} from "@/lib/enter-gate";
import { PARTICLE_OPTIONS } from "@/lib/settings";
import { uploadEnterGateBackgroundToStorage } from "@/lib/uploads/enter-gate-client";
import { MAX_BACKGROUND_UPLOAD_LABEL } from "@/lib/uploads/limits";
import type { ParticleEffect, ProfileSettings } from "@/lib/types/settings";
import type { Profile } from "@/lib/types/profile";

const fileInputClassName =
  "block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#fafafa] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]";

export type EnterGateFormFields = {
  enter_gate_title: string;
  enter_gate_subtitle: string;
  enter_gate_button: string;
  enter_gate_show_avatar: boolean;
  enter_gate_show_username: boolean;
  enter_gate_show_branding: boolean;
  enter_gate_blur: boolean;
  enter_gate_blur_strength: number;
  enter_gate_background_type: ProfileSettings["enter_gate_background_type"];
  enter_gate_background_color: string;
  enter_gate_gradient_colors: string;
  enter_gate_animated_gradient: boolean;
  enter_gate_overlay_opacity: number;
  enter_gate_vignette: boolean;
  enter_gate_noise: boolean;
  enter_gate_particle_effect: ParticleEffect | "";
  enter_gate_title_color: string;
  enter_gate_subtitle_color: string;
  enter_gate_accent_color: string;
  enter_gate_text_align: ProfileSettings["enter_gate_text_align"];
  enter_gate_button_style: ProfileSettings["enter_gate_button_style"];
  enter_gate_animation: ProfileSettings["enter_gate_animation"];
  enter_gate_glass_card: boolean;
  enter_gate_card_opacity: number;
};

export function readEnterGateForm(settings: ProfileSettings): EnterGateFormFields {
  return {
    enter_gate_title: settings.enter_gate_title,
    enter_gate_subtitle: settings.enter_gate_subtitle,
    enter_gate_button: settings.enter_gate_button,
    enter_gate_show_avatar: settings.enter_gate_show_avatar,
    enter_gate_show_username: settings.enter_gate_show_username,
    enter_gate_show_branding: settings.enter_gate_show_branding,
    enter_gate_blur: settings.enter_gate_blur,
    enter_gate_blur_strength: settings.enter_gate_blur_strength,
    enter_gate_background_type: settings.enter_gate_background_type,
    enter_gate_background_color: settings.enter_gate_background_color,
    enter_gate_gradient_colors: settings.enter_gate_gradient_colors.join(", "),
    enter_gate_animated_gradient: settings.enter_gate_animated_gradient,
    enter_gate_overlay_opacity: settings.enter_gate_overlay_opacity,
    enter_gate_vignette: settings.enter_gate_vignette,
    enter_gate_noise: settings.enter_gate_noise,
    enter_gate_particle_effect: settings.enter_gate_particle_effect ?? "",
    enter_gate_title_color: settings.enter_gate_title_color,
    enter_gate_subtitle_color: settings.enter_gate_subtitle_color,
    enter_gate_accent_color: settings.enter_gate_accent_color,
    enter_gate_text_align: settings.enter_gate_text_align,
    enter_gate_button_style: settings.enter_gate_button_style,
    enter_gate_animation: settings.enter_gate_animation,
    enter_gate_glass_card: settings.enter_gate_glass_card,
    enter_gate_card_opacity: settings.enter_gate_card_opacity,
  };
}

function buildPreviewSettings(settings: ProfileSettings, form: EnterGateFormFields): ProfileSettings {
  const gradientColors = form.enter_gate_gradient_colors
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  return {
    ...settings,
    ...form,
    enter_gate_gradient_colors:
      gradientColors.length >= 2 ? gradientColors : settings.enter_gate_gradient_colors,
    enter_gate_particle_effect: form.enter_gate_particle_effect || null,
  };
}

export function EnterGateEditor({
  settings,
  profile,
  form,
  patchForm,
}: {
  settings: ProfileSettings;
  profile: Profile;
  form: EnterGateFormFields;
  patchForm: (partial: Partial<EnterGateFormFields>) => void;
}) {
  const router = useRouter();
  const [isRemoving, startRemove] = useTransition();
  const [uploadError, setUploadError] = useState<string>();
  const [uploadSuccess, setUploadSuccess] = useState<string>();
  const [uploadPending, setUploadPending] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const previewSettings = buildPreviewSettings(settings, form);
  const displayImageUrl = imagePreview ?? settings.enter_gate_background_image_url ?? null;
  const displayVideoUrl = videoPreview ?? settings.enter_gate_background_video_url ?? null;
  const hasMedia = !!displayImageUrl || !!displayVideoUrl;
  const showBlurControls =
    form.enter_gate_blur &&
    (form.enter_gate_background_type === "profile" ||
      form.enter_gate_background_type === "image" ||
      form.enter_gate_background_type === "video");

  useEffect(() => {
    setImagePreview(null);
    setVideoPreview(null);
  }, [settings.enter_gate_background_image_url, settings.enter_gate_background_video_url]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
      if (videoPreview?.startsWith("blob:")) URL.revokeObjectURL(videoPreview);
    };
  }, [imagePreview, videoPreview]);

  const handleUpload = async (file: File | undefined) => {
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
      const { url, isVideo: uploadedVideo } = await uploadEnterGateBackgroundToStorage(file);
      const result = await saveEnterGateMediaAction(url, uploadedVideo ? "video" : "image");

      if (result.error) {
        setUploadError(result.error);
        setImagePreview(null);
        setVideoPreview(null);
        return;
      }

      setUploadSuccess(result.success);
      patchForm({ enter_gate_background_type: uploadedVideo ? "video" : "image" });
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

  const removeMedia = () => {
    startRemove(async () => {
      const result = await removeEnterGateMediaAction();
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
    <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0c] p-4">
      <p className="mb-1 text-sm font-medium text-white">Click to enter</p>
      <p className="mb-4 text-xs leading-relaxed text-neutral-500">
        Every profile requires a click before loading. Customize the intro screen background, layout, colors, and effects.
      </p>

      <div className="mb-5 overflow-hidden rounded-xl border border-white/[0.06]">
        <p className="border-b border-white/[0.06] bg-[#0a0a0a] px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          Live preview
        </p>
        <ProfileEnterGate profile={profile} settings={previewSettings} onEnter={() => {}} preview />
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Content</p>

          <div>
            <label htmlFor="enter_gate_title" className={labelClassName}>Headline</label>
            <input
              id="enter_gate_title"
              type="text"
              value={form.enter_gate_title}
              onChange={(e) => patchForm({ enter_gate_title: e.target.value })}
              placeholder="Leave empty to use your display name"
              maxLength={80}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="enter_gate_subtitle" className={labelClassName}>Subtitle</label>
            <input
              id="enter_gate_subtitle"
              type="text"
              value={form.enter_gate_subtitle}
              onChange={(e) => patchForm({ enter_gate_subtitle: e.target.value })}
              placeholder="Optional tagline or message"
              maxLength={200}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="enter_gate_button" className={labelClassName}>Button text</label>
            <input
              id="enter_gate_button"
              type="text"
              value={form.enter_gate_button}
              onChange={(e) => patchForm({ enter_gate_button: e.target.value })}
              placeholder="Click to enter"
              maxLength={40}
              className={inputClassName}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              name="enter_gate_show_avatar"
              label="Show avatar"
              checked={form.enter_gate_show_avatar}
              onCheckedChange={(enter_gate_show_avatar) => patchForm({ enter_gate_show_avatar })}
            />
            <ToggleField
              name="enter_gate_show_username"
              label="Show @username"
              description="When subtitle is empty"
              checked={form.enter_gate_show_username}
              onCheckedChange={(enter_gate_show_username) => patchForm({ enter_gate_show_username })}
            />
            <ToggleField
              name="enter_gate_show_branding"
              label="Show cried.bio footer"
              checked={form.enter_gate_show_branding}
              onCheckedChange={(enter_gate_show_branding) => patchForm({ enter_gate_show_branding })}
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-white/[0.06] pt-5">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Background</p>

          <ControlledSelect
            label="Background type"
            value={form.enter_gate_background_type}
            onChange={(v) =>
              patchForm({ enter_gate_background_type: v as ProfileSettings["enter_gate_background_type"] })
            }
            options={ENTER_GATE_BACKGROUND_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          {form.enter_gate_background_type === "solid" ? (
            <div>
              <label htmlFor="enter_gate_background_color" className={labelClassName}>Background color</label>
              <input
                id="enter_gate_background_color"
                type="color"
                value={form.enter_gate_background_color.startsWith("#") ? form.enter_gate_background_color : "#090909"}
                onChange={(e) => patchForm({ enter_gate_background_color: e.target.value })}
                className="h-10 w-full cursor-pointer rounded-lg border border-white/[0.06] bg-[#090909]"
              />
            </div>
          ) : null}

          {form.enter_gate_background_type === "gradient" ? (
            <>
              <div>
                <label htmlFor="enter_gate_gradient_colors" className={labelClassName}>
                  Gradient colors (comma-separated hex)
                </label>
                <input
                  id="enter_gate_gradient_colors"
                  type="text"
                  value={form.enter_gate_gradient_colors}
                  onChange={(e) => patchForm({ enter_gate_gradient_colors: e.target.value })}
                  placeholder="#090909, #141414, #5865F2"
                  className={inputClassName}
                />
              </div>
              <ToggleField
                name="enter_gate_animated_gradient"
                label="Animate gradient"
                checked={form.enter_gate_animated_gradient}
                onCheckedChange={(enter_gate_animated_gradient) => patchForm({ enter_gate_animated_gradient })}
              />
            </>
          ) : null}

          {(form.enter_gate_background_type === "image" || form.enter_gate_background_type === "video") ? (
            <div className="space-y-3 rounded-lg border border-white/[0.06] bg-[#0a0a0a] p-4">
              <p className="text-sm font-medium text-neutral-200">Upload background</p>
              {hasMedia ? (
                <div className="overflow-hidden rounded-lg border border-white/[0.06]">
                  {displayVideoUrl ? (
                    <video src={displayVideoUrl} autoPlay muted loop playsInline className="max-h-40 w-full object-cover" />
                  ) : displayImageUrl ? (
                    <img src={displayImageUrl} alt="" className="max-h-40 w-full object-cover" />
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">No image or video uploaded yet.</p>
              )}
              <input
                key={fileInputKey}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
                disabled={uploadPending}
                onChange={(e) => handleUpload(e.target.files?.[0])}
                className={fileInputClassName}
              />
              <p className="text-xs text-neutral-600">JPEG, PNG, WebP, GIF, or MP4 — {MAX_BACKGROUND_UPLOAD_LABEL}</p>
              {hasMedia ? (
                <RemoveMediaButton
                  label="Remove enter gate background"
                  onClick={removeMedia}
                  disabled={isRemoving || uploadPending}
                />
              ) : null}
              <FormFeedback error={uploadError} success={uploadSuccess} />
            </div>
          ) : null}

          {form.enter_gate_background_type === "profile" ? (
            <p className="text-xs text-neutral-500">
              Uses your profile background from the Background tab, blurred behind the enter screen.
            </p>
          ) : null}

          <SliderField
            name="enter_gate_overlay_opacity"
            label="Dark overlay"
            min={0}
            max={100}
            value={form.enter_gate_overlay_opacity}
            onChange={(enter_gate_overlay_opacity) => patchForm({ enter_gate_overlay_opacity })}
            unit="%"
          />

          <ToggleField
            name="enter_gate_blur"
            label="Blur background"
            description="Applies to profile, image, and video backgrounds"
            checked={form.enter_gate_blur}
            onCheckedChange={(enter_gate_blur) => patchForm({ enter_gate_blur })}
          />

          {showBlurControls ? (
            <SliderField
              name="enter_gate_blur_strength"
              label="Blur strength"
              min={0}
              max={30}
              value={form.enter_gate_blur_strength}
              onChange={(enter_gate_blur_strength) => patchForm({ enter_gate_blur_strength })}
              unit="px"
            />
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              name="enter_gate_vignette"
              label="Vignette"
              description="Darkened edges"
              checked={form.enter_gate_vignette}
              onCheckedChange={(enter_gate_vignette) => patchForm({ enter_gate_vignette })}
            />
            <ToggleField
              name="enter_gate_noise"
              label="Noise texture"
              description="Subtle film grain"
              checked={form.enter_gate_noise}
              onCheckedChange={(enter_gate_noise) => patchForm({ enter_gate_noise })}
            />
          </div>

          <ControlledSelect
            label="Particle effect"
            value={form.enter_gate_particle_effect}
            onChange={(v) => patchForm({ enter_gate_particle_effect: v as ParticleEffect | "" })}
            options={[
              { value: "", label: "None" },
              ...PARTICLE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        </section>

        <section className="space-y-4 border-t border-white/[0.06] pt-5">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Appearance</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="enter_gate_title_color" className={labelClassName}>Title color</label>
              <input
                id="enter_gate_title_color"
                type="color"
                value={form.enter_gate_title_color.startsWith("#") ? form.enter_gate_title_color : "#ffffff"}
                onChange={(e) => patchForm({ enter_gate_title_color: e.target.value })}
                className="h-10 w-full cursor-pointer rounded-lg border border-white/[0.06] bg-[#090909]"
              />
              <button
                type="button"
                onClick={() => patchForm({ enter_gate_title_color: "" })}
                className="mt-1.5 text-xs text-neutral-500 hover:text-neutral-300"
              >
                Reset to white
              </button>
            </div>
            <div>
              <label htmlFor="enter_gate_subtitle_color" className={labelClassName}>Subtitle color</label>
              <input
                id="enter_gate_subtitle_color"
                type="color"
                value={form.enter_gate_subtitle_color.startsWith("#") ? form.enter_gate_subtitle_color : "#a3a3a3"}
                onChange={(e) => patchForm({ enter_gate_subtitle_color: e.target.value })}
                className="h-10 w-full cursor-pointer rounded-lg border border-white/[0.06] bg-[#090909]"
              />
              <button
                type="button"
                onClick={() => patchForm({ enter_gate_subtitle_color: "" })}
                className="mt-1.5 text-xs text-neutral-500 hover:text-neutral-300"
              >
                Reset to gray
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="enter_gate_accent_color" className={labelClassName}>Accent color</label>
            <input
              id="enter_gate_accent_color"
              type="color"
              value={form.enter_gate_accent_color.startsWith("#") ? form.enter_gate_accent_color : settings.accent_color}
              onChange={(e) => patchForm({ enter_gate_accent_color: e.target.value })}
              className="h-10 w-full cursor-pointer rounded-lg border border-white/[0.06] bg-[#090909]"
            />
            <button
              type="button"
              onClick={() => patchForm({ enter_gate_accent_color: "" })}
              className="mt-1.5 text-xs text-neutral-500 hover:text-neutral-300"
            >
              Use profile accent ({settings.accent_color})
            </button>
          </div>

          <ControlledSelect
            label="Text alignment"
            value={form.enter_gate_text_align}
            onChange={(v) =>
              patchForm({ enter_gate_text_align: v as ProfileSettings["enter_gate_text_align"] })
            }
            options={ENTER_GATE_TEXT_ALIGN_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          <ControlledSelect
            label="Button style"
            value={form.enter_gate_button_style}
            onChange={(v) =>
              patchForm({ enter_gate_button_style: v as ProfileSettings["enter_gate_button_style"] })
            }
            options={ENTER_GATE_BUTTON_STYLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          <ControlledSelect
            label="Button animation"
            value={form.enter_gate_animation}
            onChange={(v) =>
              patchForm({ enter_gate_animation: v as ProfileSettings["enter_gate_animation"] })
            }
            options={ENTER_GATE_ANIMATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          <ToggleField
            name="enter_gate_glass_card"
            label="Glass content card"
            description="Frosted panel behind headline and button"
            checked={form.enter_gate_glass_card}
            onCheckedChange={(enter_gate_glass_card) => patchForm({ enter_gate_glass_card })}
          />

          {form.enter_gate_glass_card ? (
            <SliderField
              name="enter_gate_card_opacity"
              label="Card opacity"
              min={0}
              max={100}
              value={form.enter_gate_card_opacity}
              onChange={(enter_gate_card_opacity) => patchForm({ enter_gate_card_opacity })}
              unit="%"
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}
