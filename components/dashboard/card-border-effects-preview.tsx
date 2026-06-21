"use client";

import { CardBorderEffect } from "@/components/profile/card-border-effect";
import { buildCardStyle } from "@/lib/settings";
import { getCardBorderInnerRadius } from "@/lib/card-border-effects/resolve";
import type { CardBorderEffectPreset, ProfileSettings } from "@/lib/types/settings";
import { parseCardBorderTargets } from "@/lib/card-border-effects/resolve";

export type CardBorderFormState = {
  card_border_effect: CardBorderEffectPreset;
  card_border_thickness: number;
  card_border_speed: number;
  card_border_glow_intensity: number;
  card_border_color: string;
  card_border_secondary_color: string;
  card_border_apply_all: boolean;
  card_border_targets: string;
  border_radius: number;
  profile_opacity: number;
  profile_blur: number;
  glassmorphism: boolean;
  accent_color: string;
};

export function buildCardBorderPreviewSettings(
  settings: ProfileSettings,
  form: CardBorderFormState,
): ProfileSettings {
  return {
    ...settings,
    ...form,
    card_border_targets: parseCardBorderTargets(form.card_border_targets),
  };
}

export function CardBorderEffectsPreview({
  settings,
  form,
}: {
  settings: ProfileSettings;
  form: CardBorderFormState;
}) {
  const preview = buildCardBorderPreviewSettings(settings, form);
  const cardStyle = buildCardStyle(preview);
  const innerRadius = getCardBorderInnerRadius(preview, "main");

  return (
    <div className="sticky top-24 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Live preview</p>
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050505] p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 55%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05), transparent 50%)",
          }}
        />
        <CardBorderEffect settings={preview} target="main" borderRadius={preview.border_radius}>
          <div className="relative w-full px-6 py-8" style={{ ...cardStyle, borderRadius: innerRadius }}>
            <div className="flex flex-col items-center text-center">
              <div
                className="mb-3 h-14 w-14 rounded-full border-2"
                style={{ borderColor: `${preview.accent_color}55`, background: `${preview.accent_color}22` }}
              />
              <p className="text-lg font-bold text-white">Preview User</p>
              <p className="mt-1 text-xs text-neutral-500">cried.bio/preview</p>
              <p className="mt-3 max-w-[220px] text-sm text-neutral-300">
                Border effects animate around the card edge only.
              </p>
            </div>
          </div>
        </CardBorderEffect>
      </div>
      <p className="text-xs leading-relaxed text-neutral-600">
        Glass and transparent cards keep their fill — only the outline animates.
      </p>
    </div>
  );
}
