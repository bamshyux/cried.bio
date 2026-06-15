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
      <PageHeader title="Effects" description="Cursor, username, bio, and page entrance animations." />
      <div className={cardClassName}>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="_section" value="effects" />

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
            <ToggleField name="typing_bio" label="Typing bio" description="Bio types out on load" defaultChecked={settings.typing_bio} />
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
