"use client";

import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import {
  SaveConfirmation,
  useDashboardSettingsSection,
} from "@/components/dashboard/use-settings-form";
import {
  buttonPrimaryClassName,
  cardClassName,
  ColorField,
  labelClassName,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { ProfileBio } from "@/components/profile/public/profile-bio";
import { BIO_FONT_WEIGHT_OPTIONS, BIO_LETTER_SPACING_OPTIONS, FONT_OPTIONS } from "@/lib/settings";
import type { BioLetterSpacing, ProfileSettings } from "@/lib/types/settings";

type BioStyleFormState = {
  bio_color: string;
  bio_use_text_color: boolean;
  bio_font_family: string;
  bio_use_profile_font: boolean;
  bio_font_size: number;
  bio_font_weight: number;
  bio_italic: boolean;
  bio_glow: boolean;
  bio_letter_spacing: BioLetterSpacing;
};

function readBioStyleForm(settings: ProfileSettings): BioStyleFormState {
  return {
    bio_color: settings.bio_color,
    bio_use_text_color: !settings.bio_color?.trim(),
    bio_font_family: settings.bio_font_family,
    bio_use_profile_font: !settings.bio_font_family?.trim(),
    bio_font_size: settings.bio_font_size,
    bio_font_weight: settings.bio_font_weight,
    bio_italic: settings.bio_italic,
    bio_glow: settings.bio_glow,
    bio_letter_spacing: settings.bio_letter_spacing,
  };
}

function previewSettings(settings: ProfileSettings, form: BioStyleFormState): ProfileSettings {
  return {
    ...settings,
    bio_color: form.bio_use_text_color ? "" : form.bio_color,
    bio_font_family: form.bio_use_profile_font ? "" : form.bio_font_family,
    bio_font_size: form.bio_font_size,
    bio_font_weight: form.bio_font_weight,
    bio_italic: form.bio_italic,
    bio_glow: form.bio_glow,
    bio_letter_spacing: form.bio_letter_spacing,
  };
}

export function BioStyleEditor({
  settings,
  bioPreview,
  embedded = false,
}: {
  settings: ProfileSettings;
  bioPreview: string;
  embedded?: boolean;
}) {
  const { form, patchForm, submit, state, isPending } = useDashboardSettingsSection(
    "profile",
    settings,
    readBioStyleForm,
    "Bio styling saved.",
  );

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    submit({
      ...form,
      bio_color: form.bio_use_text_color ? "" : form.bio_color,
      bio_font_family: form.bio_use_profile_font ? "" : form.bio_font_family,
    });
  };

  const preview = previewSettings(settings, form);
  const sampleText = bioPreview.trim() || "This is how your bio will look on your profile.";

  const content = (
    <>
      <div className={embedded ? "mb-4" : "mb-5"}>
        <h2 className={embedded ? "text-xs font-semibold uppercase tracking-wider text-neutral-500" : "text-sm font-medium text-white"}>
          Bio styling
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Color, font, size, weight, spacing, italic, and glow. Typing animation is in Effects.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-4">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-neutral-600">Preview</p>
          <ProfileBio text={sampleText} settings={preview} className="!mb-0" />
        </div>

        <ToggleField
          name="bio_use_text_color"
          label="Use profile text color"
          description="When on, bio uses your main text color from Customize"
          checked={form.bio_use_text_color}
          onCheckedChange={(bio_use_text_color) => patchForm({ bio_use_text_color })}
        />

        {!form.bio_use_text_color ? (
          <ColorField
            name="bio_color"
            label="Bio color"
            value={form.bio_color || settings.text_color}
            onChange={(bio_color) => patchForm({ bio_color, bio_use_text_color: false })}
          />
        ) : null}

        <ToggleField
          name="bio_use_profile_font"
          label="Use profile font"
          description="When on, bio uses the font from Customize"
          checked={form.bio_use_profile_font}
          onCheckedChange={(bio_use_profile_font) => patchForm({ bio_use_profile_font })}
        />

        {!form.bio_use_profile_font ? (
          <ControlledSelect
            label="Bio font"
            value={form.bio_font_family || settings.font_family}
            onChange={(bio_font_family) => patchForm({ bio_font_family, bio_use_profile_font: false })}
            options={FONT_OPTIONS.map((f) => ({ value: f.value, label: f.label }))}
          />
        ) : null}

        <SliderField
          name="bio_font_size"
          label="Bio font size"
          min={12}
          max={32}
          value={form.bio_font_size}
          onChange={(bio_font_size) => patchForm({ bio_font_size })}
          unit="px"
        />

        <ControlledSelect
          label="Font weight"
          value={String(form.bio_font_weight)}
          onChange={(v) => patchForm({ bio_font_weight: Number(v) })}
          options={BIO_FONT_WEIGHT_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
        />

        <div>
          <label className={labelClassName}>Letter spacing</label>
          <div className="grid grid-cols-3 gap-2">
            {BIO_LETTER_SPACING_OPTIONS.map((option) => {
              const active = form.bio_letter_spacing === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => patchForm({ bio_letter_spacing: option.value })}
                  className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                    active
                      ? "border-[var(--bf-accent)]/40 bg-[var(--bf-accent)]/10 text-white"
                      : "border-white/[0.08] bg-[#0f0f0f] text-neutral-400 hover:border-white/[0.14] hover:text-neutral-200"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleField
            name="bio_italic"
            label="Italic bio"
            checked={form.bio_italic}
            onCheckedChange={(bio_italic) => patchForm({ bio_italic })}
          />
          <ToggleField
            name="bio_glow"
            label="Bio glow"
            description="Soft glow using bio color and accent"
            checked={form.bio_glow}
            onCheckedChange={(bio_glow) => patchForm({ bio_glow })}
          />
        </div>

        <SaveConfirmation success={state.success} error={state.error} />
        <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
          {isPending ? "Saving..." : "Save bio styling"}
        </button>
      </form>
    </>
  );

  if (embedded) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a]/60 p-4">
        {content}
      </div>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}
