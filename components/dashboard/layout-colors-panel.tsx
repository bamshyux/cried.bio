"use client";

import { ColorField } from "@/components/dashboard/form-fields";
import {
  getLayoutColorSlotDefault,
  getLayoutColorSlotLabel,
  layoutColorSlots,
  layoutSupportsColorCustomization,
  writeLayoutColorOverride,
} from "@/lib/layout-colors";
import type { ProfileLayout, ProfileSettings } from "@/lib/types/settings";

export type LayoutColorFields = {
  layout_primary_color: string;
  layout_secondary_color: string;
  layout_tertiary_color: string;
};

export type LayoutColorsFormState = LayoutColorFields & {
  layout: ProfileLayout;
};

export function readLayoutColorFields(settings: ProfileSettings): LayoutColorFields {
  return {
    layout_primary_color: settings.layout_primary_color,
    layout_secondary_color: settings.layout_secondary_color,
    layout_tertiary_color: settings.layout_tertiary_color,
  };
}

export function LayoutColorsPanel({
  settings,
  form,
  onPatch,
  className = "",
}: {
  settings: ProfileSettings;
  form: LayoutColorsFormState;
  onPatch: (patch: Partial<LayoutColorsFormState>) => void;
  className?: string;
}) {
  if (!layoutSupportsColorCustomization(form.layout)) {
    return (
      <div className={`rounded-xl border border-white/[0.08] bg-[#0c0c0c] p-4 ${className}`.trim()}>
        <p className="text-sm font-semibold text-white">Layout colors</p>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          This layout uses your profile accent from Customize. Select a themed layout like Hologram, Arcade, or Crystal to customize its palette here.
        </p>
      </div>
    );
  }

  const previewSettings = { ...settings, ...form };
  const hasOverrides =
    Boolean(form.layout_primary_color?.trim()) ||
    Boolean(form.layout_secondary_color?.trim()) ||
    Boolean(form.layout_tertiary_color?.trim());

  return (
    <div className={`rounded-xl border border-white/[0.08] bg-[#0c0c0c] p-4 ${className}`.trim()}>
      <p className="text-sm font-semibold text-white">Layout colors</p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">
        Customize the theme accents for your selected layout without changing your global profile accent.
      </p>
      <div className="mt-4 space-y-4">
        {layoutColorSlots(form.layout).map((slot) => {
          const field =
            slot === "primary"
              ? "layout_primary_color"
              : slot === "secondary"
                ? "layout_secondary_color"
                : "layout_tertiary_color";
          const stored = form[field];
          const effective = getLayoutColorSlotDefault(previewSettings, slot);
          const hasOverride = Boolean(stored?.trim());

          return (
            <div key={slot}>
              <ColorField
                name={field}
                label={getLayoutColorSlotLabel(form.layout, slot)}
                value={hasOverride ? stored : effective}
                onChange={(color) =>
                  onPatch({
                    [field]: writeLayoutColorOverride(color, previewSettings, slot),
                  })
                }
              />
              {!hasOverride ? (
                <p className="mt-1 text-[11px] text-neutral-600">Using layout default</p>
              ) : (
                <button
                  type="button"
                  onClick={() => onPatch({ [field]: "" })}
                  className="mt-1 text-[11px] font-medium text-neutral-500 transition-colors hover:text-neutral-300"
                >
                  Reset to default
                </button>
              )}
            </div>
          );
        })}
      </div>
      {hasOverrides ? (
        <button
          type="button"
          onClick={() =>
            onPatch({
              layout_primary_color: "",
              layout_secondary_color: "",
              layout_tertiary_color: "",
            })
          }
          className="mt-4 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-300"
        >
          Reset all layout colors
        </button>
      ) : null}
    </div>
  );
}
