"use client";

import { useCallback } from "react";
import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import {
  SaveConfirmation,
  useSettingsForm,
  useSyncedSettingsState,
} from "@/components/dashboard/use-settings-form";
import {
  buttonPrimaryClassName,
  cardClassName,
  inputClassName,
  labelClassName,
  PageHeader,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { CURSOR_EFFECT_OPTIONS, USERNAME_EFFECT_OPTIONS } from "@/lib/settings";
import type { CursorEffect, ProfileSettings, UsernameEffect } from "@/lib/types/settings";

type EffectsFormState = {
  cursorEffect: CursorEffect;
  usernameEffect: UsernameEffect;
  typingBio: boolean;
  hoverAnimations: boolean;
  pageEntrance: boolean;
  enterGateTitle: string;
  enterGateSubtitle: string;
  enterGateButton: string;
  enterGateShowAvatar: boolean;
};

function readEffectsForm(settings: ProfileSettings): EffectsFormState {
  return {
    cursorEffect: settings.cursor_effect,
    usernameEffect: settings.username_effect,
    typingBio: settings.typing_bio,
    hoverAnimations: settings.hover_animations,
    pageEntrance: settings.page_entrance,
    enterGateTitle: settings.enter_gate_title,
    enterGateSubtitle: settings.enter_gate_subtitle,
    enterGateButton: settings.enter_gate_button,
    enterGateShowAvatar: settings.enter_gate_show_avatar,
  };
}

export function EffectsEditor({ settings }: { settings: ProfileSettings }) {
  const { state, submit, isPending } = useSettingsForm("effects", "Effects saved.");
  const [form, setForm] = useSyncedSettingsState(settings.updated_at, readEffectsForm(settings));

  const patchForm = useCallback(
    (partial: Partial<EffectsFormState>) => setForm((prev) => ({ ...prev, ...partial })),
    [setForm],
  );

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    submit({
      cursor_effect: form.cursorEffect,
      username_effect: form.usernameEffect,
      typing_bio: form.typingBio,
      hover_animations: form.hoverAnimations,
      page_entrance: form.pageEntrance,
      enter_gate_title: form.enterGateTitle,
      enter_gate_subtitle: form.enterGateSubtitle,
      enter_gate_button: form.enterGateButton,
      enter_gate_show_avatar: form.enterGateShowAvatar,
    });
  };

  return (
    <>
      <PageHeader title="Effects" description="Cursor, username, bio, page entrance, and click-to-enter screen." />
      <div className={cardClassName}>
        <form onSubmit={handleSave} data-dashboard-primary-form className="space-y-5">
          <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0c] p-4">
            <p className="mb-4 text-sm font-medium text-white">Click to enter</p>
            <p className="mb-4 text-xs leading-relaxed text-neutral-500">
              Every profile requires a click before loading — like guns.lol. Customize the intro screen below.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="enter_gate_title" className={labelClassName}>
                  Headline
                </label>
                <input
                  id="enter_gate_title"
                  type="text"
                  value={form.enterGateTitle}
                  onChange={(e) => patchForm({ enterGateTitle: e.target.value })}
                  placeholder="Leave empty to use your display name"
                  maxLength={80}
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="enter_gate_subtitle" className={labelClassName}>
                  Subtitle
                </label>
                <input
                  id="enter_gate_subtitle"
                  type="text"
                  value={form.enterGateSubtitle}
                  onChange={(e) => patchForm({ enterGateSubtitle: e.target.value })}
                  placeholder="Optional tagline or message"
                  maxLength={200}
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="enter_gate_button" className={labelClassName}>
                  Button text
                </label>
                <input
                  id="enter_gate_button"
                  type="text"
                  value={form.enterGateButton}
                  onChange={(e) => patchForm({ enterGateButton: e.target.value })}
                  placeholder="Click to enter"
                  maxLength={40}
                  className={inputClassName}
                />
              </div>

              <ToggleField
                key={`gate-avatar-${form.enterGateShowAvatar}`}
                name="enter_gate_show_avatar"
                label="Show avatar"
                defaultChecked={form.enterGateShowAvatar}
                onCheckedChange={(enterGateShowAvatar) => patchForm({ enterGateShowAvatar })}
              />
            </div>
          </div>

          <ControlledSelect
            label="Cursor effect"
            value={form.cursorEffect}
            onChange={(v) => patchForm({ cursorEffect: v as CursorEffect })}
            options={CURSOR_EFFECT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          <ControlledSelect
            label="Username effect"
            value={form.usernameEffect}
            onChange={(v) => patchForm({ usernameEffect: v as UsernameEffect })}
            options={USERNAME_EFFECT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              key={`typing-${form.typingBio}`}
              name="typing_bio"
              label="Typing bio"
              description="Bio types out, pauses, then backspaces in a loop"
              defaultChecked={form.typingBio}
              onCheckedChange={(typingBio) => patchForm({ typingBio })}
            />
            <ToggleField
              key={`hover-${form.hoverAnimations}`}
              name="hover_animations"
              label="Hover animations"
              defaultChecked={form.hoverAnimations}
              onCheckedChange={(hoverAnimations) => patchForm({ hoverAnimations })}
            />
            <ToggleField
              key={`entrance-${form.pageEntrance}`}
              name="page_entrance"
              label="Page entrance"
              defaultChecked={form.pageEntrance}
              onCheckedChange={(pageEntrance) => patchForm({ pageEntrance })}
            />
          </div>

          <SaveConfirmation success={state.success} error={state.error} />
          <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
            {isPending ? "Saving..." : "Save effects"}
          </button>
        </form>
      </div>
    </>
  );
}

export function EffectsPageShell({ settings }: { settings: ProfileSettings }) {
  return <EffectsEditor settings={settings} />;
}
