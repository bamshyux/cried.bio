"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateContentPageTextAction } from "@/app/actions/profile-pages";
import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import {
  buttonPrimaryClassName,
  cardClassName,
  FormFeedback,
  labelClassName,
  PageHeader,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { useClearUnsavedOnSuccess, useUnsavedChangesOptional } from "@/components/dashboard/unsaved-changes";
import { ProfileBio } from "@/components/profile/public/profile-bio";
import { BIO_FONT_WEIGHT_OPTIONS, BIO_LETTER_SPACING_OPTIONS, FONT_OPTIONS, getProfileAlignClass } from "@/lib/settings";
import type { ProfilePage } from "@/lib/profile-pages/slug";
import type { BioLetterSpacing, ProfileSettings } from "@/lib/types/settings";

type TextFormState = {
  bio: string;
  bio_color: string;
  bio_use_text_color: boolean;
  bio_font_family: string;
  bio_use_page_font: boolean;
  bio_font_size: number;
  bio_font_weight: number;
  bio_italic: boolean;
  bio_glow: boolean;
  bio_letter_spacing: BioLetterSpacing;
  typing_bio: boolean;
};

function readTextForm(page: ProfilePage, settings: ProfileSettings): TextFormState {
  return {
    bio: page.bio ?? "",
    bio_color: settings.bio_color,
    bio_use_text_color: !settings.bio_color?.trim(),
    bio_font_family: settings.bio_font_family,
    bio_use_page_font: !settings.bio_font_family?.trim(),
    bio_font_size: settings.bio_font_size,
    bio_font_weight: settings.bio_font_weight,
    bio_italic: settings.bio_italic,
    bio_glow: settings.bio_glow,
    bio_letter_spacing: settings.bio_letter_spacing,
    typing_bio: settings.typing_bio,
  };
}

function previewSettings(settings: ProfileSettings, form: TextFormState): ProfileSettings {
  return {
    ...settings,
    bio_color: form.bio_use_text_color ? "" : form.bio_color,
    bio_font_family: form.bio_use_page_font ? "" : form.bio_font_family,
    bio_font_size: form.bio_font_size,
    bio_font_weight: form.bio_font_weight,
    bio_italic: form.bio_italic,
    bio_glow: form.bio_glow,
    bio_letter_spacing: form.bio_letter_spacing,
    typing_bio: form.typing_bio,
  };
}

function BioTextColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className={labelClassName}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-white/[0.08] bg-[#141414]"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Page text color (${fallback})`}
          className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-3 py-2 text-xs text-white placeholder:text-neutral-600"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 text-[10px] uppercase tracking-wide text-neutral-500 hover:text-white"
          >
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ContentPageTextEditor({
  page,
  settings,
  pageId,
}: {
  page: ProfilePage;
  settings: ProfileSettings;
  pageId: string;
}) {
  const router = useRouter();
  const unsaved = useUnsavedChangesOptional();
  const [form, setForm] = useState(() => readTextForm(page, settings));
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>();
  const [isPending, startTransition] = useTransition();

  useClearUnsavedOnSuccess(feedback ?? {}, isPending);

  useEffect(() => {
    setForm(readTextForm(page, settings));
  }, [page.bio, page.updated_at, settings.updated_at, page, settings]);

  const patchForm = (partial: Partial<TextFormState>) => {
    setForm((current) => ({ ...current, ...partial }));
    unsaved?.markDirty();
  };

  const preview = useMemo(() => previewSettings(settings, form), [settings, form]);
  const sampleText =
    form.bio.trim() ||
    "Write about cried.bio here — what it is, why you built it, or anything you want visitors to read.";

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    unsaved?.markSaving();
    startTransition(async () => {
      const result = await updateContentPageTextAction(pageId, {
        ...form,
        bio_color: form.bio_use_text_color ? "" : form.bio_color,
        bio_font_family: form.bio_use_page_font ? "" : form.bio_font_family,
      });
      setFeedback(result);
      if (result.error) {
        unsaved?.clearSaving();
      } else {
        router.refresh();
      }
    });
  };

  return (
    <>
      <PageHeader
        title="Text"
        description="Add a bio or description for this page, then style how it looks."
      />

      <div className="mb-6 lg:hidden">
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0a]">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Preview</p>
          </div>
          <div className="p-5">
            <h2 className="mb-3 text-lg font-bold text-white">{page.label || page.slug}</h2>
            <div className={getProfileAlignClass(settings.content_alignment)}>
              <ProfileBio text={sampleText} settings={preview} className="!mb-0" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className={cardClassName}>
          <form onSubmit={handleSave} data-dashboard-primary-form className="space-y-6">
            <div>
              <label htmlFor="page_bio" className={labelClassName}>
                Page text
              </label>
              <textarea
                id="page_bio"
                value={form.bio}
                onChange={(e) => patchForm({ bio: e.target.value })}
                placeholder="cried.bio is a modern link-in-bio platform where you can build a personal site with custom pages, music, effects, and more."
                rows={6}
                maxLength={2000}
                className="mt-2 w-full resize-y rounded-xl border border-white/[0.08] bg-[#0f0f0f] px-4 py-3 text-sm leading-relaxed text-white placeholder:text-neutral-600 focus:border-white/20 focus:outline-none"
              />
              <p className="mt-2 text-xs text-neutral-600">
                {form.bio.length}/2000 characters. Shown below the page title on the live page.
              </p>
            </div>

            <div className="border-t border-white/[0.06] pt-6">
              <h2 className="text-sm font-medium text-white">Text styling</h2>
              <div className="mt-4 space-y-5">
                <BioTextColorField
                  label="Text color"
                  value={form.bio_use_text_color ? "" : form.bio_color}
                  fallback={settings.text_color}
                  onChange={(bio_color) => {
                    if (!bio_color.trim()) {
                      patchForm({ bio_color: "", bio_use_text_color: true });
                      return;
                    }
                    patchForm({ bio_color, bio_use_text_color: false });
                  }}
                />

                <ToggleField
                  name="bio_use_text_color"
                  label="Use page text color"
                  description="When on, text matches your Style tab text color"
                  checked={form.bio_use_text_color}
                  onCheckedChange={(bio_use_text_color) =>
                    patchForm({
                      bio_use_text_color,
                      bio_color: bio_use_text_color ? "" : form.bio_color || settings.text_color,
                    })
                  }
                />

                <ToggleField
                  name="bio_use_page_font"
                  label="Use page font"
                  description="When on, text uses the font from your Style tab"
                  checked={form.bio_use_page_font}
                  onCheckedChange={(bio_use_page_font) => patchForm({ bio_use_page_font })}
                />

                {!form.bio_use_page_font ? (
                  <ControlledSelect
                    label="Text font"
                    value={form.bio_font_family || settings.font_family}
                    onChange={(bio_font_family) =>
                      patchForm({ bio_font_family, bio_use_page_font: false })
                    }
                    options={FONT_OPTIONS.map((f) => ({ value: f.value, label: f.label }))}
                  />
                ) : null}

                <SliderField
                  name="bio_font_size"
                  label="Font size"
                  min={12}
                  max={32}
                  value={form.bio_font_size}
                  onChange={(bio_font_size) => patchForm({ bio_font_size })}
                  unit="px"
                />

                <ControlledSelect
                  label="Font weight"
                  value={String(form.bio_font_weight)}
                  onChange={(value) => patchForm({ bio_font_weight: Number(value) })}
                  options={BIO_FONT_WEIGHT_OPTIONS.map((option) => ({
                    value: String(option.value),
                    label: option.label,
                  }))}
                />

                <div>
                  <label className={labelClassName}>Letter spacing</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
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
                    label="Italic"
                    checked={form.bio_italic}
                    onCheckedChange={(bio_italic) => patchForm({ bio_italic })}
                  />
                  <ToggleField
                    name="bio_glow"
                    label="Text glow"
                    description="Soft glow using text and accent colors"
                    checked={form.bio_glow}
                    onCheckedChange={(bio_glow) => patchForm({ bio_glow })}
                  />
                  <ToggleField
                    name="typing_bio"
                    label="Typing animation"
                    description="Text types out, pauses, then loops"
                    checked={form.typing_bio}
                    onCheckedChange={(typing_bio) => patchForm({ typing_bio })}
                  />
                </div>
              </div>
            </div>

            <FormFeedback {...feedback} />
            <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
              {isPending ? "Saving..." : "Save page text"}
            </button>
          </form>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0a]">
            <div className="border-b border-white/[0.06] px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Preview</p>
            </div>
            <div className="p-5">
              <h2 className="mb-3 text-lg font-bold text-white">{page.label || page.slug}</h2>
              <div className={getProfileAlignClass(settings.content_alignment)}>
                <ProfileBio text={sampleText} settings={preview} className="!mb-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
