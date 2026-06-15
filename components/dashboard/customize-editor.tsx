"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateSettingsAction } from "@/app/actions/settings";
import { FONT_OPTIONS, LINK_ANIMATION_OPTIONS, CONTENT_ALIGNMENT_OPTIONS } from "@/lib/settings";
import {
  getLayoutLabelHint,
  getLayoutLabelPlaceholder,
  layoutSupportsCustomLabel,
} from "@/lib/layout-labels";
import type { ContentAlignment, LinkAnimation, ProfileLayout, ProfileSettings, SettingsFormState } from "@/lib/types/settings";
import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import {
  buttonPrimaryClassName,
  cardClassName,
  ColorField,
  FormFeedback,
  inputClassName,
  labelClassName,
  PageHeader,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { useSettingsRefresh } from "@/components/dashboard/use-settings-refresh";
import { useUnsavedChanges } from "@/components/dashboard/unsaved-changes";

const initial: SettingsFormState = {};

export function CustomizeEditor({ settings }: { settings: ProfileSettings }) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initial);
  useSettingsRefresh(state);
  const { markDirty, setLastDirtyForm } = useUnsavedChanges();
  const formRef = useRef<HTMLFormElement>(null);

  const [fontFamily, setFontFamily] = useState(settings.font_family);
  const [linkAnimation, setLinkAnimation] = useState(settings.link_animation);
  const [contentAlignment, setContentAlignment] = useState<ContentAlignment>(settings.content_alignment);
  const [statusUseAccent, setStatusUseAccent] = useState(!settings.profile_status_color?.trim());

  useEffect(() => {
    setFontFamily(settings.font_family);
    setLinkAnimation(settings.link_animation);
    setContentAlignment(settings.content_alignment);
    setStatusUseAccent(!settings.profile_status_color?.trim());
  }, [settings.updated_at]);

  return (
    <>
      <PageHeader title="Customize" description="Colors, typography, card styling, and profile display options." />
      <div className={cardClassName}>
        <form ref={formRef} action={formAction} data-dashboard-primary-form className="space-y-6">
          <input type="hidden" name="_section" value="customize" />

          <div className="grid gap-5 sm:grid-cols-2">
            <ColorField name="accent_color" label="Accent color" defaultValue={settings.accent_color} />
            <ColorField name="text_color" label="Text color" defaultValue={settings.text_color} />
          </div>

          <ControlledSelect
            name="font_family"
            label="Font"
            value={fontFamily}
            onChange={(v) => setFontFamily(v)}
            options={FONT_OPTIONS.map((f) => ({ value: f.value, label: f.label }))}
          />

          <div>
            <label className={labelClassName}>Text alignment</label>
            <p className="mb-2 text-xs text-neutral-600">
              Align your profile text left, center, or right within your profile card
            </p>
            <div className="grid grid-cols-3 gap-2">
              {CONTENT_ALIGNMENT_OPTIONS.map((option) => {
                const active = contentAlignment === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setContentAlignment(option.value);
                      if (formRef.current) setLastDirtyForm(formRef.current);
                      markDirty();
                    }}
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
            <input type="hidden" name="content_alignment" value={contentAlignment} />
          </div>

          {layoutSupportsCustomLabel(settings.layout) && (
            <div>
              <label htmlFor="layout_label" className={labelClassName}>Layout label</label>
              <input
                id="layout_label"
                name="layout_label"
                type="text"
                defaultValue={settings.layout_label}
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
            <SliderField name="border_radius" label="Corner radius" min={0} max={48} defaultValue={settings.border_radius} unit="px" />
            <SliderField name="profile_opacity" label="Card opacity" min={0} max={100} defaultValue={settings.profile_opacity} unit="%" />
            <SliderField name="profile_blur" label="Blur" min={0} max={40} defaultValue={settings.profile_blur} unit="px" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField name="glassmorphism" label="Glassmorphism" defaultChecked={settings.glassmorphism} />
            <ToggleField name="neon_glow" label="Accent glow" defaultChecked={settings.neon_glow} />
            <ToggleField name="hide_card_border" label="Hide card border" description="Removes the card outline — useful at 0% opacity" defaultChecked={settings.hide_card_border} />
            <ToggleField name="show_view_count" label="Show view count" defaultChecked={settings.show_view_count} />
            <ToggleField name="show_join_date" label="Show join date" defaultChecked={settings.show_join_date} />
            <ToggleField
              name="profile_parallax"
              label="Parallax profile animation"
              description="Tilt your profile card when visitors hover over it"
              defaultChecked={settings.profile_parallax}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="profile_status" className={labelClassName}>Status text</label>
              <input
                id="profile_status"
                name="profile_status"
                type="text"
                defaultValue={settings.profile_status}
                placeholder="Living · Building · Streaming"
                className={inputClassName}
              />
              <p className="mt-1.5 text-xs text-neutral-600">Shown next to a colored dot below your username on your profile</p>
            </div>
            <ToggleField
              name="profile_status_use_accent"
              label="Use profile accent for status dot"
              description="When off, pick a custom color for your status indicator"
              defaultChecked={statusUseAccent}
              onCheckedChange={setStatusUseAccent}
            />
            {!statusUseAccent && (
              <ColorField
                name="profile_status_color"
                label="Status dot color"
                defaultValue={settings.profile_status_color || settings.accent_color}
              />
            )}
          </div>

          <ControlledSelect
            name="link_animation"
            label="Default link animation"
            value={linkAnimation}
            onChange={(v) => setLinkAnimation(v as LinkAnimation)}
            options={LINK_ANIMATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          <FormFeedback error={state.error} success={state.success} />
          <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
            {isPending ? "Saving..." : "Save customization"}
          </button>
        </form>
      </div>
    </>
  );
}

export function CustomizePageShell({ settings }: { settings: ProfileSettings }) {
  return <CustomizeEditor settings={settings} />;
}
