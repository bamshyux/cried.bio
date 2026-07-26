"use client";

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
import { LayoutPreview } from "@/components/dashboard/layout-preview";
import { PremiumLockBadge } from "@/components/premium/premium-locked";
import { useUpgradeModal } from "@/components/premium/upgrade-modal";
import {
  FREE_LAYOUT_OPTIONS,
  PREMIUM_LAYOUT_OPTIONS,
  type LayoutOption,
} from "@/lib/settings";
import { isPremiumProfileLayout, sanitizeProfileLayoutSelection } from "@/lib/premium/layout-settings";
import type { CustomTheme } from "@/lib/types/custom-theme";
import type { ProfileLayout, ProfileSettings } from "@/lib/types/settings";
import Link from "next/link";
import { useCallback } from "react";
import type { UserEntitlements } from "@/lib/premium/types";

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

function LayoutGrid({
  options,
  activeLayout,
  canUsePremiumLayouts,
  onSelect,
}: {
  options: LayoutOption[];
  activeLayout: ProfileLayout;
  canUsePremiumLayouts: boolean;
  onSelect: (layout: ProfileLayout) => void;
}) {
  const { openUpgrade } = useUpgradeModal();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {options.map((layout) => {
        const locked = layout.premiumOnly && !canUsePremiumLayouts;
        const isActive = activeLayout === layout.value;
        return (
          <button
            key={layout.value}
            type="button"
            onClick={() => {
              if (locked) {
                openUpgrade();
                return;
              }
              onSelect(layout.value);
            }}
            className={`rounded-xl border p-4 text-left transition-all ${
              isActive
                ? "border-[#fafafa]/50 bg-[#fafafa]/[0.06] ring-1 ring-[#fafafa]/30"
                : locked
                  ? "border-amber-500/15 bg-[#0f0f0f]/80 opacity-80 hover:border-amber-500/25"
                  : "border-white/[0.06] bg-[#0f0f0f] hover:border-white/10 hover:bg-[#141414]"
            }`}
          >
            <LayoutPreview layout={layout.value} />
            <div className="mt-3 flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-white">{layout.label}</p>
              {locked ? <PremiumLockBadge /> : null}
            </div>
            <p className="mt-0.5 text-xs text-neutral-500">{layout.description}</p>
          </button>
        );
      })}
    </div>
  );
}

export function ThemesEditor({
  settings,
  themes,
  entitlements,
  pageId,
}: {
  settings: ProfileSettings;
  themes: CustomTheme[];
  entitlements: UserEntitlements;
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

  const canUsePremiumLayouts = entitlements.animated_effects;

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    submit({
      ...form,
      layout: sanitizeProfileLayoutSelection(form.layout, canUsePremiumLayouts),
    });
  };

  return (
    <>
      <PageHeader title="Layouts" description="Choose how your public profile is structured." />
      <div className={cardClassName} data-tour="tour-layouts">
        <form onSubmit={handleSave} data-dashboard-primary-form className="space-y-8">
          <div>
            <label className={labelClassName}>Standard layouts</label>
            <p className="mb-3 text-xs text-neutral-600">Included on every plan.</p>
            <LayoutGrid
              options={FREE_LAYOUT_OPTIONS}
              activeLayout={form.layout}
              canUsePremiumLayouts={canUsePremiumLayouts}
              onSelect={(layout) => patchForm({ layout })}
            />
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <label className={labelClassName}>Premium Lite layouts</label>
              <span className="rounded-full border border-[rgba(201,184,150,0.28)] bg-[rgba(201,184,150,0.08)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#d4c4a8]">
                {PREMIUM_LAYOUT_OPTIONS.length} exclusive
              </span>
            </div>
            <p className="mb-3 text-xs text-neutral-600">Extra profile structures unlocked with Premium Lite.</p>
            <LayoutGrid
              options={PREMIUM_LAYOUT_OPTIONS}
              activeLayout={form.layout}
              canUsePremiumLayouts={canUsePremiumLayouts}
              onSelect={(layout) => patchForm({ layout })}
            />
            {!canUsePremiumLayouts && isPremiumProfileLayout(form.layout) ? (
              <p className="mt-3 text-xs text-amber-200/80">
                Your current premium layout will fall back to Classic on your public profile until you upgrade.
              </p>
            ) : null}
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
  entitlements,
  pageId,
}: {
  settings: ProfileSettings;
  themes: CustomTheme[];
  entitlements: UserEntitlements;
  pageId?: string;
}) {
  return <ThemesEditor settings={settings} themes={themes} entitlements={entitlements} pageId={pageId} />;
}
