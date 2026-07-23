"use client";

import Link from "next/link";
import { useCallback } from "react";
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
} from "@/components/dashboard/form-fields";
import { LAYOUT_OPTIONS } from "@/lib/settings";
import type { CustomTheme } from "@/lib/types/custom-theme";
import type { ProfileLayout, ProfileSettings } from "@/lib/types/settings";
import { LayoutPreview } from "@/components/dashboard/layout-preview";

type ThemesFormState = {
  layout: ProfileLayout;
  custom_theme_id: string;
};

function readThemesForm(settings: ProfileSettings, fallbackThemeId: string): ThemesFormState {
  return {
    layout: settings.layout,
    custom_theme_id: settings.custom_theme_id ?? fallbackThemeId,
  };
}

export function ThemesEditor({
  settings,
  themes,
  pageId,
}: {
  settings: ProfileSettings;
  themes: CustomTheme[];
  pageId?: string;
}) {
  const fallbackThemeId = themes[0]?.id ?? "";
  const readForm = useCallback(
    (next: ProfileSettings) => readThemesForm(next, fallbackThemeId),
    [fallbackThemeId],
  );

  const { form, patchForm, submit, state, isPending } = useDashboardSettingsSection(
    "themes",
    settings,
    readForm,
    "Theme saved.",
    undefined,
    pageId,
  );

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    submit(form);
  };

  return (
    <>
      <PageHeader title="Layouts" description="Choose how your public profile is structured." />
      <div className={cardClassName}>
        <form onSubmit={handleSave} data-dashboard-primary-form className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {LAYOUT_OPTIONS.map((layout) => {
              const isActive = form.layout === layout.value;
              return (
                <button
                  key={layout.value}
                  type="button"
                  onClick={() => patchForm({ layout: layout.value })}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    isActive
                      ? "border-[#fafafa]/50 bg-[#fafafa]/[0.06] ring-1 ring-[#fafafa]/30"
                      : "border-white/[0.06] bg-[#0f0f0f] hover:border-white/10 hover:bg-[#141414]"
                  }`}
                >
                  <LayoutPreview layout={layout.value} />
                  <p className="mt-3 text-sm font-medium text-white">{layout.label}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{layout.description}</p>
                </button>
              );
            })}
          </div>

          {form.layout === "custom" && (
            <div className="rounded-xl border border-[var(--bf-accent)]/20 bg-[var(--bf-accent)]/[0.04] p-4">
              <p className="mb-3 text-sm font-medium text-white">Custom theme</p>
              {themes.length > 0 ? (
                <div className="mb-3">
                  <label htmlFor="custom_theme_pick" className={labelClassName}>
                    Active theme
                  </label>
                  <select
                    id="custom_theme_pick"
                    value={form.custom_theme_id}
                    onChange={(e) => patchForm({ custom_theme_id: e.target.value })}
                    className={inputClassName}
                  >
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="mb-3 text-xs text-neutral-500">Create a theme in the builder first.</p>
              )}
              <Link href="/dashboard/custom-theme" className={`${buttonPrimaryClassName} inline-flex`}>
                Open theme builder
              </Link>
            </div>
          )}

          <SaveConfirmation success={state.success} error={state.error} />
          <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
            {isPending ? "Saving..." : "Save layout"}
          </button>
        </form>
      </div>
    </>
  );
}

export function ThemesPageShell({
  settings,
  themes,
  pageId,
}: {
  settings: ProfileSettings;
  themes: CustomTheme[];
  pageId?: string;
}) {
  return <ThemesEditor settings={settings} themes={themes} pageId={pageId} />;
}
