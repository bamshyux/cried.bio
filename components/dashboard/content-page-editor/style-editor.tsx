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
  PageHeader,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { ContentPageStylePreview, type ContentPageStyleFormState } from "@/components/dashboard/content-page-editor/style-preview";
import { useUpgradeModal } from "@/components/premium/upgrade-modal";
import { CARD_BORDER_EFFECT_OPTIONS } from "@/lib/card-border-effects/presets";
import { isPremiumCardBorderEffect, sanitizeCardBorderEffectSelection } from "@/lib/card-border-effects/premium";
import { readContentPageBorderTargets } from "@/lib/card-border-effects/resolve";
import { PREMIUM_FONT_OPTIONS, isPremiumFont } from "@/lib/premium/fonts";
import { FONT_OPTIONS, CONTENT_ALIGNMENT_OPTIONS } from "@/lib/settings";
import type { ProfilePage } from "@/lib/profile-pages/slug";
import type { ProfileSettings } from "@/lib/types/settings";

function readContentPageStyleForm(settings: ProfileSettings): ContentPageStyleFormState {
  const borderTargets = readContentPageBorderTargets(settings);
  return {
    accent_color: settings.accent_color,
    text_color: settings.text_color,
    font_family: settings.font_family,
    content_alignment: settings.content_alignment,
    border_radius: settings.border_radius,
    profile_opacity: settings.profile_opacity,
    profile_blur: settings.profile_blur,
    glassmorphism: settings.glassmorphism,
    neon_glow: settings.neon_glow,
    hide_card_border: settings.hide_card_border,
    card_border_effect: settings.card_border_effect,
    border_content_card: borderTargets.contentCard,
    border_links: borderTargets.links,
  };
}

export function ContentPageStyleEditor({
  page,
  settings,
  pageId,
  canUsePremiumFonts = false,
  canUsePremiumBorderEffects = false,
}: {
  page: ProfilePage;
  settings: ProfileSettings;
  pageId: string;
  canUsePremiumFonts?: boolean;
  canUsePremiumBorderEffects?: boolean;
}) {
  const { openUpgrade } = useUpgradeModal();
  const { form, patchForm, submit, state, isPending } = useDashboardSettingsSection(
    "customize",
    settings,
    readContentPageStyleForm,
    "Page style saved.",
    undefined,
    pageId,
  );

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    submit({
      ...form,
      card_border_effect: sanitizeCardBorderEffectSelection(
        form.card_border_effect,
        canUsePremiumBorderEffects,
      ),
    });
  };

  return (
    <>
      <PageHeader
        title="Style"
        description="Colors, fonts, and card look for this page. Changes only apply here — not your main profile."
      />

      <div className="mb-6 lg:hidden">
        <ContentPageStylePreview page={page} settings={settings} form={form} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className={cardClassName}>
          <form onSubmit={handleSave} data-dashboard-primary-form className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-white">Colors & type</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
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

              <div className="mt-5">
                <ControlledSelect
                  label="Font"
                  value={form.font_family}
                  onChange={(font_family) => {
                    if (isPremiumFont(font_family) && !canUsePremiumFonts) {
                      openUpgrade();
                      return;
                    }
                    patchForm({ font_family });
                  }}
                  options={[
                    ...FONT_OPTIONS.map((f) => ({ value: f.value, label: f.label })),
                    ...PREMIUM_FONT_OPTIONS.map((f) => ({
                      value: f.value,
                      label: `${f.label}${canUsePremiumFonts ? "" : " ★ Premium"}`,
                    })),
                  ]}
                />
              </div>

              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-white">Content alignment</p>
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
            </div>

            <div className="border-t border-white/[0.06] pt-6">
              <h2 className="text-sm font-medium text-white">Content card</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-3">
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

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ToggleField
                  name="glassmorphism"
                  label="Glass effect"
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
                  description="Useful when the card is fully transparent"
                  checked={form.hide_card_border}
                  onCheckedChange={(hide_card_border) => patchForm({ hide_card_border })}
                />
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-6">
              <ControlledSelect
                label="Border animation"
                value={form.card_border_effect}
                onChange={(card_border_effect) => {
                  const next = card_border_effect as ContentPageStyleFormState["card_border_effect"];
                  if (isPremiumCardBorderEffect(next) && !canUsePremiumBorderEffects) {
                    openUpgrade();
                    return;
                  }
                  if (next === "none") {
                    patchForm({
                      card_border_effect: next,
                      border_content_card: false,
                      border_links: false,
                    });
                    return;
                  }
                  if (form.card_border_effect === "none") {
                    patchForm({
                      card_border_effect: next,
                      border_content_card: true,
                      border_links: false,
                    });
                    return;
                  }
                  patchForm({ card_border_effect: next });
                }}
                options={CARD_BORDER_EFFECT_OPTIONS.map((option) => ({
                  value: option.value,
                  label:
                    option.premiumOnly && !canUsePremiumBorderEffects
                      ? `${option.label} — Premium Lite`
                      : option.label,
                }))}
              />
              {form.card_border_effect !== "none" ? (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-white">Apply animation to</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ToggleField
                      name="border_content_card"
                      label="Content card"
                      description="Outline around the page title, text, and content area"
                      checked={form.border_content_card}
                      onCheckedChange={(border_content_card) => {
                        const nextLinks = form.border_links;
                        if (!border_content_card && !nextLinks) return;
                        patchForm({ border_content_card });
                      }}
                    />
                    <ToggleField
                      name="border_links"
                      label="Link buttons"
                      description="Outline around each individual link button"
                      checked={form.border_links}
                      onCheckedChange={(border_links) => {
                        const nextCard = form.border_content_card;
                        if (!border_links && !nextCard) return;
                        patchForm({ border_links });
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-neutral-600">
                    Turn off one to keep the animation only on the content card or only on links — not both.
                  </p>
                </div>
              ) : (
                <>
                  <input type="hidden" name="border_content_card" value="false" />
                  <input type="hidden" name="border_links" value="false" />
                </>
              )}
            </div>

            <SaveConfirmation success={state.success} error={state.error} />
            <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
              {isPending ? "Saving..." : "Save page style"}
            </button>
          </form>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <ContentPageStylePreview page={page} settings={settings} form={form} />
          </div>
        </div>
      </div>
    </>
  );
}
