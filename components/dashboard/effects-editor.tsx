"use client";

import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import {
  EnterGateEditor,
  readEnterGateForm,
  type EnterGateFormFields,
} from "@/components/dashboard/enter-gate-editor";
import {
  SaveConfirmation,
  useDashboardSettingsSection,
} from "@/components/dashboard/use-settings-form";
import {
  buttonPrimaryClassName,
  cardClassName,
  PageHeader,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { CURSOR_EFFECT_OPTIONS, USERNAME_EFFECT_OPTIONS } from "@/lib/settings";
import type { CursorEffect, ProfileSettings, UsernameEffect } from "@/lib/types/settings";
import type { Profile } from "@/lib/types/profile";

type EffectsFormState = EnterGateFormFields & {
  cursor_effect: CursorEffect;
  username_effect: UsernameEffect;
  typing_bio: boolean;
  hover_animations: boolean;
  page_entrance: boolean;
};

function readEffectsForm(settings: ProfileSettings): EffectsFormState {
  return {
    ...readEnterGateForm(settings),
    cursor_effect: settings.cursor_effect,
    username_effect: settings.username_effect,
    typing_bio: settings.typing_bio,
    hover_animations: settings.hover_animations,
    page_entrance: settings.page_entrance,
  };
}

export function EffectsEditor({
  settings,
  profile,
}: {
  settings: ProfileSettings;
  profile: Profile;
}) {
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
          <EnterGateEditor
            settings={settings}
            profile={profile}
            form={form}
            patchForm={patchForm}
          />

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

export function EffectsPageShell({
  settings,
  profile,
}: {
  settings: ProfileSettings;
  profile: Profile;
}) {
  return <EffectsEditor settings={settings} profile={profile} />;
}
