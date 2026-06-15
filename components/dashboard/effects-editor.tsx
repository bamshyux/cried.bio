"use client";

import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import {
  SaveConfirmation,
  useDashboardSettingsSection,
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
  cursor_effect: CursorEffect;
  username_effect: UsernameEffect;
  typing_bio: boolean;
  hover_animations: boolean;
  page_entrance: boolean;
  enter_gate_title: string;
  enter_gate_subtitle: string;
  enter_gate_button: string;
  enter_gate_show_avatar: boolean;
};

function readEffectsForm(settings: ProfileSettings): EffectsFormState {
  return {
    cursor_effect: settings.cursor_effect,
    username_effect: settings.username_effect,
    typing_bio: settings.typing_bio,
    hover_animations: settings.hover_animations,
    page_entrance: settings.page_entrance,
    enter_gate_title: settings.enter_gate_title,
    enter_gate_subtitle: settings.enter_gate_subtitle,
    enter_gate_button: settings.enter_gate_button,
    enter_gate_show_avatar: settings.enter_gate_show_avatar,
  };
}

export function EffectsEditor({ settings }: { settings: ProfileSettings }) {
  const { form, patchForm, submit, state, isPending } = useDashboardSettingsSection(
    "effects",
    settings,
    readEffectsForm,
    "Effects saved.",
  );

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    submit(form);
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
                  value={form.enter_gate_title}
                  onChange={(e) => patchForm({ enter_gate_title: e.target.value })}
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
                  value={form.enter_gate_subtitle}
                  onChange={(e) => patchForm({ enter_gate_subtitle: e.target.value })}
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
                  value={form.enter_gate_button}
                  onChange={(e) => patchForm({ enter_gate_button: e.target.value })}
                  placeholder="Click to enter"
                  maxLength={40}
                  className={inputClassName}
                />
              </div>

              <ToggleField
                name="enter_gate_show_avatar"
                label="Show avatar"
                checked={form.enter_gate_show_avatar}
                onCheckedChange={(enter_gate_show_avatar) => patchForm({ enter_gate_show_avatar })}
              />
            </div>
          </div>

          <ControlledSelect
            label="Cursor effect"
            value={form.cursor_effect}
            onChange={(v) => patchForm({ cursor_effect: v as CursorEffect })}
            options={CURSOR_EFFECT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          <ControlledSelect
            label="Username effect"
            value={form.username_effect}
            onChange={(v) => patchForm({ username_effect: v as UsernameEffect })}
            options={USERNAME_EFFECT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              name="typing_bio"
              label="Typing bio"
              description="Bio types out, pauses, then backspaces in a loop"
              checked={form.typing_bio}
              onCheckedChange={(typing_bio) => patchForm({ typing_bio })}
            />
            <ToggleField
              name="hover_animations"
              label="Hover animations"
              checked={form.hover_animations}
              onCheckedChange={(hover_animations) => patchForm({ hover_animations })}
            />
            <ToggleField
              name="page_entrance"
              label="Page entrance"
              checked={form.page_entrance}
              onCheckedChange={(page_entrance) => patchForm({ page_entrance })}
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
