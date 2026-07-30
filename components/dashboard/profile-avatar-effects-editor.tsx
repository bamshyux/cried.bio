"use client";

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
} from "@/components/dashboard/form-fields";
import { ProfileAvatar } from "@/components/profile/public/layout-primitives";
import { PremiumLockBadge } from "@/components/premium/premium-locked";
import { useUpgradeModal } from "@/components/premium/upgrade-modal";
import { PROFILE_AVATAR_EFFECT_OPTIONS } from "@/lib/profile-avatar-effects/presets";
import { sanitizeProfileAvatarEffectSelection } from "@/lib/profile-avatar-effects/premium";
import { resolveProfileAvatarEffect } from "@/lib/profile-avatar-effects/resolve";
import type { UserEntitlements } from "@/lib/premium/types";
import type { Profile } from "@/lib/types/profile";
import type { ProfileSettings } from "@/lib/types/settings";

type ProfileAvatarFormState = {
  profile_avatar_effect: ProfileSettings["profile_avatar_effect"];
  profile_avatar_effect_thickness: number;
  profile_avatar_effect_speed: number;
  profile_avatar_effect_glow: number;
  profile_avatar_effect_color: string;
  profile_avatar_effect_secondary_color: string;
};

function readProfileAvatarForm(settings: ProfileSettings): ProfileAvatarFormState {
  return {
    profile_avatar_effect: settings.profile_avatar_effect,
    profile_avatar_effect_thickness: settings.profile_avatar_effect_thickness,
    profile_avatar_effect_speed: settings.profile_avatar_effect_speed,
    profile_avatar_effect_glow: settings.profile_avatar_effect_glow,
    profile_avatar_effect_color: settings.profile_avatar_effect_color || settings.accent_color,
    profile_avatar_effect_secondary_color:
      settings.profile_avatar_effect_secondary_color || settings.gradient_colors?.[1] || settings.accent_color,
  };
}

function mergePreviewSettings(settings: ProfileSettings, form: ProfileAvatarFormState): ProfileSettings {
  return {
    ...settings,
    ...form,
  };
}

function AvatarEffectPreview({
  profile,
  settings,
  form,
}: {
  profile: Profile;
  settings: ProfileSettings;
  form: ProfileAvatarFormState;
}) {
  const previewSettings = mergePreviewSettings(settings, form);
  const displayName = profile.display_name || profile.username || "You";

  return (
    <div className={cardClassName}>
      <p className="mb-4 text-sm font-medium text-white">Live preview</p>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#0a0a0a] px-6 py-10">
        <ProfileAvatar
          profile={profile}
          displayName={displayName}
          accentColor={settings.accent_color}
          settings={previewSettings}
          className="h-28 w-28"
        />
        <p className="text-sm font-semibold text-white">{displayName}</p>
        <p className="text-xs text-neutral-500">
          {form.profile_avatar_effect === "none"
            ? "No effect selected"
            : PROFILE_AVATAR_EFFECT_OPTIONS.find((o) => o.value === form.profile_avatar_effect)?.label}
        </p>
      </div>
    </div>
  );
}

export function ProfileAvatarEffectsEditor({
  settings,
  profile,
  entitlements,
}: {
  settings: ProfileSettings;
  profile: Profile;
  entitlements: UserEntitlements;
}) {
  const { openUpgrade } = useUpgradeModal();
  const canUsePremiumEffects = entitlements.animated_effects;

  const { form, patchForm, submit, state, isPending } = useDashboardSettingsSection(
    "profile_avatar",
    settings,
    readProfileAvatarForm,
    "Profile effects saved.",
  );

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    submit({
      ...form,
      profile_avatar_effect: sanitizeProfileAvatarEffectSelection(
        form.profile_avatar_effect,
        canUsePremiumEffects,
      ),
    });
  };

  const previewSettings = mergePreviewSettings(settings, form);

  return (
    <>
      <PageHeader
        title="Profile Effects"
        description="Animated borders around your profile picture — Premium exclusive."
      />

      {!canUsePremiumEffects ? (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/80">
          Profile picture effects require Premium Lite. You can preview styles below — upgrade to apply them on
          your profile.
        </div>
      ) : null}

      <div className="mb-6 lg:hidden">
        <AvatarEffectPreview profile={profile} settings={settings} form={form} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className={cardClassName}>
          <form onSubmit={handleSave} data-dashboard-primary-form className="space-y-6">
            <input type="hidden" name="profile_avatar_effect" value={form.profile_avatar_effect} />
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <label className={labelClassName}>Avatar border effects</label>
                <PremiumLockBadge />
              </div>
              <p className="mb-3 text-xs text-neutral-600">
                Pick an animated ring around your profile picture. Effects show on every layout.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PROFILE_AVATAR_EFFECT_OPTIONS.map((option) => {
                  const locked = option.premiumOnly && !canUsePremiumEffects;
                  const active = form.profile_avatar_effect === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        if (locked) {
                          openUpgrade();
                          return;
                        }
                        patchForm({ profile_avatar_effect: option.value });
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
            </div>

            {form.profile_avatar_effect !== "none" ? (
              <>
                <SliderField
                  label="Border thickness"
                  name="profile_avatar_effect_thickness"
                  min={1}
                  max={8}
                  value={form.profile_avatar_effect_thickness}
                  onChange={(profile_avatar_effect_thickness) =>
                    patchForm({ profile_avatar_effect_thickness })
                  }
                  unit="px"
                />
                <SliderField
                  label="Animation speed"
                  name="profile_avatar_effect_speed"
                  min={25}
                  max={300}
                  value={form.profile_avatar_effect_speed}
                  onChange={(profile_avatar_effect_speed) => patchForm({ profile_avatar_effect_speed })}
                  unit="%"
                />
                <SliderField
                  label="Glow intensity"
                  name="profile_avatar_effect_glow"
                  min={0}
                  max={100}
                  value={form.profile_avatar_effect_glow}
                  onChange={(profile_avatar_effect_glow) => patchForm({ profile_avatar_effect_glow })}
                  unit="%"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorField
                    label="Primary color"
                    name="profile_avatar_effect_color"
                    value={form.profile_avatar_effect_color}
                    onChange={(profile_avatar_effect_color) => patchForm({ profile_avatar_effect_color })}
                  />
                  <ColorField
                    label="Secondary color"
                    name="profile_avatar_effect_secondary_color"
                    value={form.profile_avatar_effect_secondary_color}
                    onChange={(profile_avatar_effect_secondary_color) =>
                      patchForm({ profile_avatar_effect_secondary_color })
                    }
                  />
                </div>
              </>
            ) : null}

            <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
              {isPending ? "Saving..." : "Save profile effects"}
            </button>
            <SaveConfirmation success={state.success} error={state.error} />
          </form>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <AvatarEffectPreview profile={profile} settings={settings} form={form} />
            {resolveProfileAvatarEffect(previewSettings, 112) ? (
              <p className="text-center text-xs text-neutral-600">
                Preview uses your current avatar and saved accent colors.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

export function ProfileAvatarEffectsPageShell({
  settings,
  profile,
  entitlements,
}: {
  settings: ProfileSettings;
  profile: Profile;
  entitlements: UserEntitlements;
}) {
  return (
    <ProfileAvatarEffectsEditor settings={settings} profile={profile} entitlements={entitlements} />
  );
}
