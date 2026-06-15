"use client";

import { useActionState, useEffect, useState } from "react";
import { updateSettingsAction } from "@/app/actions/settings";
import { CURSOR_EFFECT_OPTIONS, USERNAME_EFFECT_OPTIONS } from "@/lib/settings";
import type { CursorEffect, ProfileSettings, SettingsFormState, UsernameEffect } from "@/lib/types/settings";
import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import {
  buttonPrimaryClassName,
  cardClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
  PageHeader,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { useSettingsRefresh } from "@/components/dashboard/use-settings-refresh";

const initial: SettingsFormState = {};

export function EffectsEditor({ settings }: { settings: ProfileSettings }) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initial);
  useSettingsRefresh(state);

  const [cursorEffect, setCursorEffect] = useState(settings.cursor_effect);
  const [usernameEffect, setUsernameEffect] = useState(settings.username_effect);

  useEffect(() => {
    setCursorEffect(settings.cursor_effect);
    setUsernameEffect(settings.username_effect);
  }, [settings.updated_at, settings.cursor_effect, settings.username_effect]);

  return (
    <>
      <PageHeader title="Effects" description="Cursor, username, bio, page entrance, and click-to-enter screen." />
      <div className={cardClassName}>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="_section" value="effects" />

          <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0c] p-4">
            <p className="mb-4 text-sm font-medium text-white">Click to enter</p>
            <p className="mb-4 text-xs leading-relaxed text-neutral-500">
              Visitors see a full-screen intro before your profile loads — like guns.lol. Click anywhere on the screen to enter.
            </p>

            <div className="space-y-4">
              <ToggleField
                name="enter_gate_enabled"
                label="Enable click-to-enter"
                description="Require a click before showing your profile"
                defaultChecked={settings.enter_gate_enabled}
              />

              <div>
                <label htmlFor="enter_gate_title" className={labelClassName}>
                  Headline
                </label>
                <input
                  id="enter_gate_title"
                  name="enter_gate_title"
                  type="text"
                  defaultValue={settings.enter_gate_title}
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
                  name="enter_gate_subtitle"
                  type="text"
                  defaultValue={settings.enter_gate_subtitle}
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
                  name="enter_gate_button"
                  type="text"
                  defaultValue={settings.enter_gate_button}
                  placeholder="Click to enter"
                  maxLength={40}
                  className={inputClassName}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ToggleField
                  name="enter_gate_show_avatar"
                  label="Show avatar"
                  defaultChecked={settings.enter_gate_show_avatar}
                />
                <ToggleField
                  name="enter_gate_blur"
                  label="Blur profile behind gate"
                  defaultChecked={settings.enter_gate_blur}
                />
              </div>
            </div>
          </div>

          <ControlledSelect
            name="cursor_effect"
            label="Cursor effect"
            value={cursorEffect}
            onChange={(v) => setCursorEffect(v as CursorEffect)}
            options={CURSOR_EFFECT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          <ControlledSelect
            name="username_effect"
            label="Username effect"
            value={usernameEffect}
            onChange={(v) => setUsernameEffect(v as UsernameEffect)}
            options={USERNAME_EFFECT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField name="typing_bio" label="Typing bio" description="Bio types out, pauses, then backspaces in a loop" defaultChecked={settings.typing_bio} />
            <ToggleField name="hover_animations" label="Hover animations" defaultChecked={settings.hover_animations} />
            <ToggleField name="page_entrance" label="Page entrance" defaultChecked={settings.page_entrance} />
          </div>

          <FormFeedback error={state.error} success={state.success} />
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
