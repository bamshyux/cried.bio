"use client";

import { ColorField, ToggleField, buttonSecondaryClassName } from "@/components/dashboard/form-fields";
import {
  getLayoutColorSlotDefault,
  getLayoutColorSlotLabel,
  layoutColorSlots,
  layoutPanelSupported,
  layoutSupportsBorderToggle,
  layoutSupportsColorCustomization,
  writeLayoutColorOverride,
} from "@/lib/layout-colors";
import type { ProfileLayout, ProfileSettings } from "@/lib/types/settings";

export type LayoutColorFields = {
  layout_primary_color: string;
  layout_secondary_color: string;
  layout_tertiary_color: string;
  layout_hide_border: boolean;
};

export type LayoutColorsFormState = LayoutColorFields & {
  layout: ProfileLayout;
};

export function readLayoutColorFields(settings: ProfileSettings): LayoutColorFields {
  return {
    layout_primary_color: settings.layout_primary_color,
    layout_secondary_color: settings.layout_secondary_color,
    layout_tertiary_color: settings.layout_tertiary_color,
    layout_hide_border: settings.layout_hide_border,
  };
}

export function clearLayoutColorOverrides(): Pick<
  LayoutColorFields,
  "layout_primary_color" | "layout_secondary_color" | "layout_tertiary_color"
> {
  return {
    layout_primary_color: "",
    layout_secondary_color: "",
    layout_tertiary_color: "",
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
  const supportsColors = layoutSupportsColorCustomization(form.layout);
  const supportsBorder = layoutSupportsBorderToggle(form.layout);

  if (!layoutPanelSupported(form.layout)) {
    return (
      <div className={`rounded-xl border border-white/[0.08] bg-[#0c0c0c] p-4 ${className}`.trim()}>
        <p className="text-sm font-semibold text-white">Layout options</p>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          This layout uses your profile accent from Customize. Select a themed layout to customize colors or hide its frame here.
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
      <p className="text-sm font-semibold text-white">Layout options</p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">
        {supportsColors
          ? "Customize this layout's theme accents and frame without changing your global profile accent."
          : "Adjust how this layout's outer frame appears on your profile."}
      </p>

      {supportsColors ? (
        <>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">Colors</p>
          <div className="mt-3 space-y-4">
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
          <button
            type="button"
            onClick={() => onPatch(clearLayoutColorOverrides())}
            disabled={!hasOverrides}
            className={`${buttonSecondaryClassName} mt-4 w-full disabled:cursor-not-allowed disabled:opacity-45`}
          >
            Use original colors
          </button>
          {!hasOverrides ? (
            <p className="mt-2 text-center text-[11px] text-neutral-600">This layout is using its original palette.</p>
          ) : null}
        </>
      ) : null}

      {supportsBorder ? (
        <div className={supportsColors ? "mt-5 border-t border-white/[0.06] pt-5" : "mt-4"}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">Border</p>
          <div className="mt-3">
            <ToggleField
              name="layout_hide_border"
              label="Hide layout border"
              description="Removes this layout's decorative outer frame and keeps the content flush with your card."
              checked={form.layout_hide_border}
              onCheckedChange={(layout_hide_border) => onPatch({ layout_hide_border })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
