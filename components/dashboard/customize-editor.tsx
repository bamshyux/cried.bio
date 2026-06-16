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
  inputClassName,
  labelClassName,
  PageHeader,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { FONT_OPTIONS, CONTENT_ALIGNMENT_OPTIONS } from "@/lib/settings";
import {
  getLayoutLabelHint,
  getLayoutLabelPlaceholder,
  layoutSupportsCustomLabel,
} from "@/lib/layout-labels";
import { CustomizePreview, type CustomizeFormState } from "@/components/dashboard/customize-preview";
import type { ProfileLayout, ProfileSettings } from "@/lib/types/settings";

function readCustomizeForm(settings: ProfileSettings): CustomizeFormState {
  return {
    accent_color: settings.accent_color,
    text_color: settings.text_color,
    font_family: settings.font_family,
    content_alignment: settings.content_alignment,
    layout_label: settings.layout_label,
    border_radius: settings.border_radius,
    profile_opacity: settings.profile_opacity,
    profile_blur: settings.profile_blur,
    glassmorphism: settings.glassmorphism,
    neon_glow: settings.neon_glow,
    hide_card_border: settings.hide_card_border,
    show_view_count: settings.show_view_count,
    show_join_date: settings.show_join_date,
    profile_parallax: settings.profile_parallax,
    profile_status: settings.profile_status,
    profile_status_use_accent: !settings.profile_status_color?.trim(),
    profile_status_color: settings.profile_status_color || settings.accent_color,
  };
}

export function CustomizeEditor({ settings }: { settings: ProfileSettings }) {
  const { form, patchForm, submit, state, isPending } = useDashboardSettingsSection(
    "customize",
    settings,
    readCustomizeForm,
    "Customization saved.",
  );

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    submit(form);
  };

  return (
    <>
      <PageHeader title="Customize" description="Colors, typography, card styling, and profile display options." />

      <div className="mb-6 lg:hidden">
        <CustomizePreview settings={settings} form={form} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className={cardClassName}>
          <form onSubmit={handleSave} data-dashboard-primary-form className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <ColorField
              name="accent_color"
              label="Accent color"
              value={form.accent_color}
              onChange={(accent_color) => patchForm({ accent_color })}
            />
            <ColorField
              name="text_color"
              label="Text color"
              value={form.text_color}
              onChange={(text_color) => patchForm({ text_color })}
            />
          </div>

          <ControlledSelect
            label="Font"
            value={form.font_family}
            onChange={(font_family) => patchForm({ font_family })}
            options={FONT_OPTIONS.map((f) => ({ value: f.value, label: f.label }))}
          />
          <p className="-mt-3 text-xs text-neutral-600">
            See the live preview for how this font looks on your profile.
          </p>

          <div>
            <label className={labelClassName}>Text alignment</label>
            <p className="mb-2 text-xs text-neutral-600">
              Align your profile text left, center, or right within your profile card
            </p>
            <div className="grid grid-cols-3 gap-2">
              {CONTENT_ALIGNMENT_OPTIONS.map((option) => {
                const active = form.content_alignment === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => patchForm({ content_alignment: option.value })}
                    className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${
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

          {layoutSupportsCustomLabel(settings.layout) && (
            <div>
              <label htmlFor="layout_label" className={labelClassName}>
                Layout label
              </label>
              <input
                id="layout_label"
                type="text"
                value={form.layout_label}
                onChange={(e) => patchForm({ layout_label: e.target.value })}
                placeholder={getLayoutLabelPlaceholder(settings.layout as ProfileLayout)}
                maxLength={64}
                className={inputClassName}
              />
              <p className="mt-1.5 text-xs text-neutral-600">
                {getLayoutLabelHint(settings.layout as ProfileLayout)}
              </p>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-3">
            <SliderField
              name="border_radius"
              label="Corner radius"
              min={0}
              max={48}
              value={form.border_radius}
              onChange={(border_radius) => patchForm({ border_radius })}
              unit="px"
            />
            <SliderField
              name="profile_opacity"
              label="Card opacity"
              min={0}
              max={100}
              value={form.profile_opacity}
              onChange={(profile_opacity) => patchForm({ profile_opacity })}
              unit="%"
            />
            <SliderField
              name="profile_blur"
              label="Blur"
              min={0}
              max={40}
              value={form.profile_blur}
              onChange={(profile_blur) => patchForm({ profile_blur })}
              unit="px"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              name="glassmorphism"
              label="Glassmorphism"
              checked={form.glassmorphism}
              onCheckedChange={(glassmorphism) => patchForm({ glassmorphism })}
            />
            <ToggleField
              name="neon_glow"
              label="Accent glow"
              checked={form.neon_glow}
              onCheckedChange={(neon_glow) => patchForm({ neon_glow })}
            />
            <ToggleField
              name="hide_card_border"
              label="Hide card border"
              description="Removes the card outline — useful at 0% opacity"
              checked={form.hide_card_border}
              onCheckedChange={(hide_card_border) => patchForm({ hide_card_border })}
            />
            <ToggleField
              name="show_view_count"
              label="Show view count"
              checked={form.show_view_count}
              onCheckedChange={(show_view_count) => patchForm({ show_view_count })}
            />
            <ToggleField
              name="show_join_date"
              label="Show join date"
              checked={form.show_join_date}
              onCheckedChange={(show_join_date) => patchForm({ show_join_date })}
            />
            <ToggleField
              name="profile_parallax"
              label="Parallax profile animation"
              description="Tilt your profile card when visitors hover over it"
              checked={form.profile_parallax}
              onCheckedChange={(profile_parallax) => patchForm({ profile_parallax })}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="profile_status" className={labelClassName}>
                Status text
              </label>
              <input
                id="profile_status"
                type="text"
                value={form.profile_status}
                onChange={(e) => patchForm({ profile_status: e.target.value })}
                placeholder="Living · Building · Streaming"
                className={inputClassName}
              />
              <p className="mt-1.5 text-xs text-neutral-600">
                Shown next to a colored dot below your username on your profile
              </p>
            </div>
            <ToggleField
              name="profile_status_use_accent"
              label="Use profile accent for status dot"
              description="When off, pick a custom color for your status indicator"
              checked={form.profile_status_use_accent}
              onCheckedChange={(profile_status_use_accent) => patchForm({ profile_status_use_accent })}
            />
            {!form.profile_status_use_accent && (
              <ColorField
                name="profile_status_color"
                label="Status dot color"
                value={form.profile_status_color}
                onChange={(profile_status_color) => patchForm({ profile_status_color })}
              />
            )}
          </div>

          <SaveConfirmation success={state.success} error={state.error} />
          <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
            {isPending ? "Saving..." : "Save customization"}
          </button>
        </form>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <CustomizePreview settings={settings} form={form} />
          </div>
        </div>
      </div>
    </>
  );
}

export function CustomizePageShell({ settings }: { settings: ProfileSettings }) {
  return <CustomizeEditor settings={settings} />;
}
