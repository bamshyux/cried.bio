"use client";

import Link from "next/link";
import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import {
  buttonPrimaryClassName,
  cardClassName,
  labelClassName,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { ProfileGuestbookSection } from "@/components/profile/public/profile-guestbook";
import {
  SaveConfirmation,
  useDashboardSettingsSection,
} from "@/components/dashboard/use-settings-form";
import type { GuestbookEntry } from "@/lib/types/guestbook";
import type {
  GuestbookBorderStyle,
  GuestbookSpacing,
  ProfileSettings,
} from "@/lib/types/settings";

type GuestbookAppearanceForm = {
  guestbook_use_profile_card: boolean;
  guestbook_opacity: number;
  guestbook_blur: number;
  guestbook_glassmorphism: boolean;
  guestbook_show_background: boolean;
  guestbook_background_color: string;
  guestbook_message_opacity: number;
  guestbook_author_opacity: number;
  guestbook_label_opacity: number;
  guestbook_text_color: string;
  guestbook_border_style: GuestbookBorderStyle;
  guestbook_spacing: GuestbookSpacing;
  guestbook_padding_y: number;
};

function readGuestbookAppearanceForm(settings: ProfileSettings): GuestbookAppearanceForm {
  return {
    guestbook_use_profile_card: settings.guestbook_use_profile_card,
    guestbook_opacity: settings.guestbook_opacity,
    guestbook_blur: settings.guestbook_blur,
    guestbook_glassmorphism: settings.guestbook_glassmorphism,
    guestbook_show_background: settings.guestbook_show_background,
    guestbook_background_color: settings.guestbook_background_color,
    guestbook_message_opacity: settings.guestbook_message_opacity,
    guestbook_author_opacity: settings.guestbook_author_opacity,
    guestbook_label_opacity: settings.guestbook_label_opacity,
    guestbook_text_color: settings.guestbook_text_color,
    guestbook_border_style: settings.guestbook_border_style,
    guestbook_spacing: settings.guestbook_spacing,
    guestbook_padding_y: settings.guestbook_padding_y,
  };
}

function previewSettings(settings: ProfileSettings, form: GuestbookAppearanceForm): ProfileSettings {
  return { ...settings, ...form, guestbook_enabled: true };
}

const PREVIEW_ENTRIES: GuestbookEntry[] = [
  {
    id: "preview-1",
    profile_id: "preview",
    author_id: "author-1",
    message: "love the vibe here",
    is_approved: true,
    is_pinned: false,
    pinned_at: null,
    created_at: new Date().toISOString(),
    author: { username: "alex", display_name: "Alex", avatar_url: null },
  },
  {
    id: "preview-2",
    profile_id: "preview",
    author_id: "author-2",
    message: "pinned note from you",
    is_approved: true,
    is_pinned: true,
    pinned_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    author: { username: "you", display_name: "You", avatar_url: null },
  },
];

const BORDER_OPTIONS: { value: GuestbookBorderStyle; label: string }[] = [
  { value: "accent-left", label: "Accent line (left)" },
  { value: "subtle-full", label: "Subtle box" },
  { value: "none", label: "None" },
];

const SPACING_OPTIONS: { value: GuestbookSpacing; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "relaxed", label: "Relaxed" },
];

function GuestbookTextColorField({
  value,
  fallback,
  onChange,
}: {
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className={labelClassName}>Message text color</label>
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
          placeholder={`Auto (${fallback})`}
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

export function GuestbookAppearanceEditor({ settings }: { settings: ProfileSettings }) {
  const { form, patchForm, submit, state, isPending } = useDashboardSettingsSection(
    "guestbook",
    settings,
    readGuestbookAppearanceForm,
    "Guestbook appearance saved.",
    "guestbook-appearance",
  );

  const preview = previewSettings(settings, form);
  const cardControlsDisabled = form.guestbook_use_profile_card;
  const backgroundDisabled = cardControlsDisabled || !form.guestbook_show_background;

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    submit(form);
  };

  return (
    <div className={`${cardClassName} mb-6`}>
      <div className="mb-5">
        <h2 className="text-sm font-medium text-white">Appearance</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Tune the guestbook card background, text opacity, borders, and spacing. Font is unchanged — use Customize for
          that.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        data-dashboard-settings-form="guestbook-appearance"
        className="space-y-5"
      >
        <div
          className="relative overflow-hidden rounded-xl border border-white/[0.06] p-4"
          style={{
            background:
              "linear-gradient(135deg, #1a1030 0%, #0c1929 45%, #141414 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute left-4 top-4 h-20 w-20 rounded-full opacity-50 blur-2xl"
            style={{ background: settings.accent_color }}
          />
          <div
            className="pointer-events-none absolute bottom-4 right-4 h-16 w-16 rounded-full opacity-35 blur-2xl"
            style={{ background: "#38bdf8" }}
          />
          <p className="relative mb-3 text-[10px] font-medium uppercase tracking-wider text-neutral-600">
            Preview
          </p>
          <ProfileGuestbookSection
            profileId="preview"
            settings={preview}
            entries={PREVIEW_ENTRIES}
            currentUserId={null}
            className="mt-0"
          />
        </div>

        <ToggleField
          name="guestbook_use_profile_card"
          label="Match main profile card"
          description="Use the same opacity, blur, and glass settings as your profile card (Customize)"
          checked={form.guestbook_use_profile_card}
          onCheckedChange={(guestbook_use_profile_card) => patchForm({ guestbook_use_profile_card })}
        />

        <ToggleField
          name="guestbook_show_background"
          label="Show background"
          description="Turn off for a transparent guestbook with no box behind messages"
          checked={form.guestbook_show_background}
          onCheckedChange={(guestbook_show_background) => patchForm({ guestbook_show_background })}
        />

        {!backgroundDisabled ? (
          <>
            <SliderField
              name="guestbook_opacity"
              label="Background opacity"
              min={0}
              max={100}
              value={form.guestbook_opacity}
              onChange={(guestbook_opacity) => patchForm({ guestbook_opacity })}
              unit="%"
            />
            <SliderField
              name="guestbook_blur"
              label="Background blur"
              min={0}
              max={30}
              value={form.guestbook_blur}
              onChange={(guestbook_blur) => patchForm({ guestbook_blur })}
              unit="px"
            />
            <ToggleField
              name="guestbook_glassmorphism"
              label="Glass effect"
              description="Frosted glass look on the guestbook background"
              checked={form.guestbook_glassmorphism}
              onCheckedChange={(guestbook_glassmorphism) => patchForm({ guestbook_glassmorphism })}
            />
            <div>
              <label className={labelClassName}>Background color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.guestbook_background_color || "#141414"}
                  onChange={(e) => patchForm({ guestbook_background_color: e.target.value })}
                  disabled={cardControlsDisabled}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-white/[0.08] bg-[#141414] disabled:opacity-40"
                />
                <input
                  type="text"
                  value={form.guestbook_background_color}
                  onChange={(e) => patchForm({ guestbook_background_color: e.target.value })}
                  placeholder="Default dark (#141414)"
                  disabled={cardControlsDisabled}
                  className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-3 py-2 text-xs text-white placeholder:text-neutral-600 disabled:opacity-40"
                />
                {form.guestbook_background_color ? (
                  <button
                    type="button"
                    onClick={() => patchForm({ guestbook_background_color: "" })}
                    disabled={cardControlsDisabled}
                    className="shrink-0 text-[10px] uppercase tracking-wide text-neutral-500 hover:text-white disabled:opacity-40"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <SliderField
            name="guestbook_message_opacity"
            label="Message opacity"
            min={10}
            max={100}
            value={form.guestbook_message_opacity}
            onChange={(guestbook_message_opacity) => patchForm({ guestbook_message_opacity })}
            unit="%"
          />
          <SliderField
            name="guestbook_author_opacity"
            label="Author opacity"
            min={10}
            max={100}
            value={form.guestbook_author_opacity}
            onChange={(guestbook_author_opacity) => patchForm({ guestbook_author_opacity })}
            unit="%"
          />
          <SliderField
            name="guestbook_label_opacity"
            label="Label opacity"
            min={10}
            max={100}
            value={form.guestbook_label_opacity}
            onChange={(guestbook_label_opacity) => patchForm({ guestbook_label_opacity })}
            unit="%"
          />
        </div>

        <GuestbookTextColorField
          value={form.guestbook_text_color}
          fallback={settings.text_color}
          onChange={(guestbook_text_color) => patchForm({ guestbook_text_color })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <ControlledSelect
            name="guestbook_border_style"
            label="Border style"
            value={form.guestbook_border_style}
            onChange={(guestbook_border_style) =>
              patchForm({ guestbook_border_style: guestbook_border_style as GuestbookBorderStyle })
            }
            options={BORDER_OPTIONS}
          />
          <ControlledSelect
            name="guestbook_spacing"
            label="Entry spacing"
            value={form.guestbook_spacing}
            onChange={(guestbook_spacing) =>
              patchForm({ guestbook_spacing: guestbook_spacing as GuestbookSpacing })
            }
            options={SPACING_OPTIONS}
          />
        </div>

        <SliderField
          name="guestbook_padding_y"
          label="Vertical padding"
          min={8}
          max={48}
          value={form.guestbook_padding_y}
          onChange={(guestbook_padding_y) => patchForm({ guestbook_padding_y })}
          unit="px"
        />

        <div className="rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-4 text-xs text-neutral-500">
          <p className="mb-2 font-medium text-neutral-400">Looking for something else?</p>
          <ul className="space-y-1.5">
            <li>
              <Link href="/dashboard/customize" className="text-neutral-300 underline-offset-2 hover:underline">
                Customize
              </Link>{" "}
              — fonts, corner radius, profile card opacity & blur
            </li>
            <li>
              <Link href="/dashboard/card-border-effects" className="text-neutral-300 underline-offset-2 hover:underline">
                Card Border Effects
              </Link>{" "}
              — animated borders on the guestbook and other cards
            </li>
          </ul>
        </div>

        <SaveConfirmation success={state.success} error={state.error} />
        <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
          {isPending ? "Saving..." : "Save appearance"}
        </button>
      </form>
    </div>
  );
}
