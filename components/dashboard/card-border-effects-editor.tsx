"use client";

import Link from "next/link";
import {
  CardBorderEffectsPreview,
  type CardBorderFormState,
} from "@/components/dashboard/card-border-effects-preview";
import {
  SaveConfirmation,
  useDashboardSettingsSection,
} from "@/components/dashboard/use-settings-form";
import {
  buttonPrimaryClassName,
  cardClassName,
  ColorField,
  labelClassName,
  PageHeader,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import {
  CARD_BORDER_TARGET_OPTIONS,
  FREE_CARD_BORDER_EFFECT_OPTIONS,
  PREMIUM_CARD_BORDER_EFFECT_OPTIONS,
  type CardBorderEffectOption,
} from "@/lib/card-border-effects/presets";
import { isPremiumCardBorderEffect, sanitizeCardBorderEffectSelection } from "@/lib/card-border-effects/premium";
import { CARD_BORDER_TARGETS } from "@/lib/card-border-effects/types";
import { parseCardBorderTargets } from "@/lib/card-border-effects/resolve";
import { PremiumLockBadge } from "@/components/premium/premium-locked";
import { useUpgradeModal } from "@/components/premium/upgrade-modal";
import type { UserEntitlements } from "@/lib/premium/types";
import type { CardBorderTarget, ProfileSettings } from "@/lib/types/settings";

function readCardBorderForm(settings: ProfileSettings): CardBorderFormState {
  return {
    card_border_effect: settings.card_border_effect,
    card_border_thickness: settings.card_border_thickness,
    card_border_speed: settings.card_border_speed,
    card_border_glow_intensity: settings.card_border_glow_intensity,
    card_border_color: settings.card_border_color || settings.accent_color,
    card_border_secondary_color:
      settings.card_border_secondary_color || settings.gradient_colors?.[1] || settings.accent_color,
    card_border_apply_all: settings.card_border_apply_all,
    card_border_targets: JSON.stringify(
      settings.card_border_targets.length ? settings.card_border_targets : [...CARD_BORDER_TARGETS],
    ),
    border_radius: settings.border_radius,
    profile_opacity: settings.profile_opacity,
    profile_blur: settings.profile_blur,
    glassmorphism: settings.glassmorphism,
    accent_color: settings.accent_color,
  };
}

function toggleTarget(targets: CardBorderTarget[], target: CardBorderTarget): CardBorderTarget[] {
  return targets.includes(target)
    ? targets.filter((entry) => entry !== target)
    : [...targets, target];
}

function EffectPresetGrid({
  options,
  activeEffect,
  canUsePremiumEffects,
  onSelect,
}: {
  options: CardBorderEffectOption[];
  activeEffect: ProfileSettings["card_border_effect"];
  canUsePremiumEffects: boolean;
  onSelect: (value: ProfileSettings["card_border_effect"]) => void;
}) {
  const { openUpgrade } = useUpgradeModal();

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const locked = option.premiumOnly && !canUsePremiumEffects;
        const active = activeEffect === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              if (locked) {
                openUpgrade();
                return;
              }
              onSelect(option.value);
            }}
            className={`rounded-xl border px-3 py-3 text-left transition-colors ${
              active
                ? "border-[var(--bf-accent)]/40 bg-[var(--bf-accent)]/10"
                : locked
                  ? "border-amber-500/15 bg-[#0f0f0f]/80 opacity-75 hover:border-amber-500/25"
                  : "border-white/[0.08] bg-[#0f0f0f] hover:border-white/[0.14]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm font-semibold ${active ? "text-white" : "text-neutral-200"}`}>
                {option.label}
              </p>
              {locked ? <PremiumLockBadge /> : null}
            </div>
            <p className="mt-1 text-xs text-neutral-500">{option.description}</p>
          </button>
        );
      })}
    </div>
  );
}

export function CardBorderEffectsEditor({
  settings,
  entitlements,
}: {
  settings: ProfileSettings;
  entitlements: UserEntitlements;
}) {
  const { form, patchForm, submit, state, isPending } = useDashboardSettingsSection(
    "card_border",
    settings,
    readCardBorderForm,
    "Card border effects saved.",
  );

  const selectedTargets = parseCardBorderTargets(form.card_border_targets);
  const canUsePremiumEffects = entitlements.animated_effects;

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    submit({
      ...form,
      card_border_effect: sanitizeCardBorderEffectSelection(
        form.card_border_effect,
        canUsePremiumEffects,
      ),
    });
  };

  return (
    <>
      <PageHeader
        title="Card Border Effects"
        description="Animated borders for profile cards — like premium guns.lol profiles. Effects stay on the outline only."
      />

      <div className="mb-4 rounded-xl border border-white/[0.06] bg-[#0c0c0c] px-4 py-3 text-sm text-neutral-400">
        Also available under{" "}
        <Link href="/dashboard/appearance" className="text-white hover:underline">
          Appearance
        </Link>{" "}
        and{" "}
        <Link href="/dashboard/customize" className="text-white hover:underline">
          Customize
        </Link>
        .
      </div>

      <div className="mb-6 lg:hidden">
        <CardBorderEffectsPreview settings={settings} form={form} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className={cardClassName}>
          <form onSubmit={handleSave} data-dashboard-primary-form className="space-y-6">
            <input type="hidden" name="card_border_targets" value={form.card_border_targets} />

            <div>
              <label className={labelClassName}>Standard effects</label>
              <p className="mb-3 text-xs text-neutral-600">
                Choose an animated outline style. None keeps your current card border.
              </p>
              <EffectPresetGrid
                options={FREE_CARD_BORDER_EFFECT_OPTIONS}
                activeEffect={form.card_border_effect}
                canUsePremiumEffects={canUsePremiumEffects}
                onSelect={(card_border_effect) => patchForm({ card_border_effect })}
              />
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <label className={labelClassName}>Premium Lite effects</label>
                <span className="rounded-full border border-[rgba(201,184,150,0.28)] bg-[rgba(201,184,150,0.08)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#d4c4a8]">
                  25 exclusive
                </span>
              </div>
              <p className="mb-3 text-xs text-neutral-600">
                Extra animated borders unlocked with Premium Lite.
              </p>
              <EffectPresetGrid
                options={PREMIUM_CARD_BORDER_EFFECT_OPTIONS}
                activeEffect={form.card_border_effect}
                canUsePremiumEffects={canUsePremiumEffects}
                onSelect={(card_border_effect) => patchForm({ card_border_effect })}
              />
              {!canUsePremiumEffects && isPremiumCardBorderEffect(form.card_border_effect) ? (
                <p className="mt-3 text-xs text-amber-200/80">
                  Your current premium effect will not appear on your profile until you upgrade.
                </p>
              ) : null}
              <input type="hidden" name="card_border_effect" value={form.card_border_effect} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <SliderField
                name="card_border_thickness"
                label="Border thickness"
                min={1}
                max={12}
                value={form.card_border_thickness}
                onChange={(card_border_thickness) => patchForm({ card_border_thickness })}
              />
              <SliderField
                name="card_border_speed"
                label="Effect speed"
                min={25}
                max={300}
                value={form.card_border_speed}
                onChange={(card_border_speed) => patchForm({ card_border_speed })}
              />
              <SliderField
                name="card_border_glow_intensity"
                label="Glow intensity"
                min={0}
                max={100}
                value={form.card_border_glow_intensity}
                onChange={(card_border_glow_intensity) => patchForm({ card_border_glow_intensity })}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <ColorField
                name="card_border_color"
                label="Border color"
                value={form.card_border_color}
                onChange={(card_border_color) => patchForm({ card_border_color })}
              />
              <ColorField
                name="card_border_secondary_color"
                label="Secondary color"
                value={form.card_border_secondary_color}
                onChange={(card_border_secondary_color) => patchForm({ card_border_secondary_color })}
              />
            </div>

            <ToggleField
              name="card_border_apply_all"
              label="Apply to all cards"
              description="When off, pick which card types get the effect."
              checked={form.card_border_apply_all}
              onCheckedChange={(card_border_apply_all) => patchForm({ card_border_apply_all })}
            />

            {!form.card_border_apply_all ? (
              <div>
                <label className={labelClassName}>Card types</label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {CARD_BORDER_TARGET_OPTIONS.map((option) => {
                    const active = selectedTargets.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          patchForm({
                            card_border_targets: JSON.stringify(
                              toggleTarget(selectedTargets, option.value),
                            ),
                          })
                        }
                        className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                          active
                            ? "border-[var(--bf-accent)]/40 bg-[var(--bf-accent)]/10 text-white"
                            : "border-white/[0.08] bg-[#0f0f0f] text-neutral-400 hover:border-white/[0.14]"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <SaveConfirmation success={state.success} error={state.error} />
            <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
              {isPending ? "Saving…" : "Save border effects"}
            </button>
          </form>
        </div>

        <div className="hidden lg:block">
          <CardBorderEffectsPreview settings={settings} form={form} />
        </div>
      </div>
    </>
  );
}

export function CardBorderEffectsPageShell({
  settings,
  entitlements,
}: {
  settings: ProfileSettings;
  entitlements: UserEntitlements;
}) {
  return <CardBorderEffectsEditor settings={settings} entitlements={entitlements} />;
}
