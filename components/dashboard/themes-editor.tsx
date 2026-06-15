"use client";

import { useActionState, useEffect, useState } from "react";
import { updateSettingsAction } from "@/app/actions/settings";
import {
  FONT_OPTIONS,
  LINK_ANIMATION_OPTIONS,
  LAYOUT_OPTIONS,
} from "@/lib/settings";
import type { ProfileLayout, ProfileSettings, SettingsFormState } from "@/lib/types/settings";
import {
  buttonPrimaryClassName,
  cardClassName,
  ColorField,
  FormFeedback,
  inputClassName,
  labelClassName,
  PageHeader,
  SelectField,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { useSettingsRefresh } from "@/components/dashboard/use-settings-refresh";
import { useUnsavedChanges } from "@/components/dashboard/unsaved-changes";

const initial: SettingsFormState = {};

function LayoutPreview({ layout }: { layout: ProfileLayout }) {
  const base = "h-16 w-full overflow-hidden rounded-md border border-white/[0.08] bg-[#0a0a0a]";

  switch (layout) {
    case "classic":
      return (
        <div className={base}>
          <div className="h-5 bg-neutral-800" />
          <div className="flex gap-1 px-2 pt-3">
            <div className="h-4 w-4 rounded-full bg-neutral-700" />
            <div className="mt-1 h-1.5 w-8 rounded bg-neutral-700" />
          </div>
        </div>
      );
    case "modern":
      return (
        <div className={`${base} flex flex-col items-center py-2`}>
          <div className="h-5 w-5 rounded-full bg-neutral-700" />
          <div className="mt-1 h-1 w-10 rounded bg-neutral-700" />
          <div className="mt-2 h-1 w-14 rounded bg-neutral-800" />
        </div>
      );
    case "gaming":
      return (
        <div className={base}>
          <div className="h-2 bg-[#fafafa]/30" />
          <div className="flex gap-1 p-2">
            <div className="h-4 w-4 bg-neutral-700" />
            <div className="h-1.5 w-8 rounded bg-neutral-700" />
          </div>
        </div>
      );
    case "portfolio":
      return (
        <div className={`${base} flex`}>
          <div className="flex w-1/3 items-center justify-center border-r border-white/[0.06]">
            <div className="h-6 w-6 rounded-full bg-neutral-700" />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1 p-2">
            <div className="h-1 w-8 rounded bg-neutral-700" />
            <div className="h-1 w-12 rounded bg-neutral-800" />
          </div>
        </div>
      );
    case "minimal":
      return (
        <div className={`${base} p-2`}>
          <div className="h-1.5 w-10 rounded bg-neutral-700" />
          <div className="mt-1 h-1 w-6 rounded bg-neutral-800" />
          <div className="mt-2 h-1 w-full rounded bg-neutral-800/80" />
        </div>
      );
    case "stacked":
      return (
        <div className={base}>
          <div className="h-5 bg-neutral-800" />
          <div className="flex flex-col items-center pt-2">
            <div className="h-4 w-4 rounded-full bg-neutral-700" />
            <div className="mt-1 h-1 w-8 rounded bg-neutral-700" />
          </div>
        </div>
      );
    case "split":
      return (
        <div className={`${base} flex`}>
          <div className="w-1/2 border-r border-white/[0.06] bg-neutral-800/80" />
          <div className="flex w-1/2 flex-col justify-center gap-1 p-2">
            <div className="h-1 w-8 rounded bg-neutral-700" />
            <div className="h-1 w-full rounded bg-neutral-800" />
          </div>
        </div>
      );
    case "terminal":
      return (
        <div className={base}>
          <div className="flex gap-0.5 border-b border-white/[0.06] px-1.5 py-1">
            <div className="h-1 w-1 rounded-full bg-red-500/60" />
            <div className="h-1 w-1 rounded-full bg-amber-500/60" />
            <div className="h-1 w-1 rounded-full bg-emerald-500/60" />
          </div>
          <div className="space-y-1 p-2 font-mono">
            <div className="h-1 w-6 rounded bg-[#fafafa]/40" />
            <div className="h-1 w-10 rounded bg-neutral-700" />
            <div className="h-1 w-full rounded bg-neutral-800" />
          </div>
        </div>
      );
    case "compact":
      return (
        <div className={`${base} flex items-center gap-1.5 p-2`}>
          <div className="h-4 w-4 shrink-0 rounded-full bg-neutral-700" />
          <div className="flex-1 space-y-1">
            <div className="h-1 w-8 rounded bg-neutral-700" />
            <div className="h-1 w-full rounded bg-neutral-800" />
          </div>
        </div>
      );
    case "card":
      return (
        <div className="flex h-16 w-full items-center justify-center">
          <div className="h-full w-3/4 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a0a0a] p-2">
            <div className="mx-auto h-3 w-3 rounded-full bg-neutral-700" />
            <div className="mx-auto mt-1 h-1 w-6 rounded bg-neutral-700" />
            <div className="mt-1.5 h-1 w-full rounded bg-neutral-800" />
          </div>
        </div>
      );
    case "neon":
      return (
        <div className="h-16 w-full rounded-md p-px" style={{ background: "linear-gradient(135deg, #fafafa, #fafafa40)" }}>
          <div className="flex h-full w-full flex-col justify-center gap-1 rounded-[5px] bg-[#0a0a0a] p-2">
            <div className="h-1 w-8 rounded bg-neutral-700" />
            <div className="h-1 w-full rounded bg-neutral-800" />
          </div>
        </div>
      );
    case "magazine":
      return (
        <div className={`${base} relative p-2`}>
          <div className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-neutral-700" />
          <div className="h-2 w-10 rounded bg-neutral-700" />
          <div className="mt-1 h-1 w-6 rounded bg-neutral-800" />
          <div className="mt-2 h-1 w-full rounded bg-neutral-800/80" />
        </div>
      );
    case "bento":
      return (
        <div className={`${base} grid grid-cols-2 gap-0.5 p-1`}>
          <div className="col-span-2 h-3 rounded bg-neutral-800/80" />
          <div className="h-4 rounded bg-neutral-800/60" />
          <div className="h-4 rounded bg-neutral-800/60" />
          <div className="col-span-2 h-3 rounded bg-neutral-800/80" />
        </div>
      );
    case "sidebar":
      return (
        <div className={`${base} flex`}>
          <div className="flex w-2/5 flex-col items-center gap-1 border-r border-white/[0.06] p-1.5">
            <div className="h-4 w-4 rounded-full bg-neutral-700" />
            <div className="h-1 w-6 rounded bg-neutral-700" />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1 p-2">
            <div className="h-1 w-full rounded bg-neutral-800" />
            <div className="h-1 w-3/4 rounded bg-neutral-800/80" />
          </div>
        </div>
      );
    case "hero":
      return (
        <div className={base}>
          <div className="relative h-8 bg-neutral-800">
            <div className="absolute bottom-1 left-2 h-1.5 w-8 rounded bg-neutral-600" />
          </div>
          <div className="flex gap-1 px-2 pt-3">
            <div className="h-4 w-4 rounded-full bg-neutral-700" />
            <div className="mt-1 h-1 w-10 rounded bg-neutral-800" />
          </div>
        </div>
      );
    case "polaroid":
      return (
        <div className={`${base} flex items-end gap-1.5 p-2`}>
          <div className="-rotate-6 rounded-sm bg-white p-0.5 pb-2 shadow">
            <div className="h-5 w-5 bg-neutral-700" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="h-1.5 w-8 rounded bg-neutral-700" />
            <div className="h-1 w-full rounded bg-neutral-800" />
          </div>
        </div>
      );
    case "cinematic":
      return (
        <div className={`${base} bg-black`}>
          <div className="h-1 bg-black" />
          <div className="flex h-6 items-center justify-center bg-neutral-800/80">
            <div className="h-1 w-8 rounded bg-neutral-600" />
          </div>
          <div className="h-1 bg-black" />
          <div className="flex flex-col items-center gap-1 p-2">
            <div className="h-3 w-3 rounded-full bg-neutral-700" />
            <div className="h-1 w-10 rounded bg-neutral-800" />
          </div>
        </div>
      );
    case "showcase":
      return (
        <div className={`${base} flex flex-col items-center py-2`}>
          <div className="relative">
            <div className="absolute -inset-1 rounded-full border border-[#fafafa]/30" />
            <div className="h-7 w-7 rounded-full bg-neutral-700" />
          </div>
          <div className="mt-1.5 h-1 w-8 rounded bg-neutral-700" />
          <div className="mt-2 h-1 w-12 rounded bg-neutral-800" />
        </div>
      );
    case "retro":
      return (
        <div className="h-16 w-full overflow-hidden rounded-md border border-[#808080]">
          <div className="h-2 bg-gradient-to-r from-[#000080] to-[#1084d0]" />
          <div className="h-full bg-[#c0c0c0] p-0.5">
            <div className="flex h-full gap-1 bg-[#0a0a0a] p-1.5">
              <div className="h-4 w-4 shrink-0 rounded-full bg-neutral-700" />
              <div className="flex-1 space-y-1">
                <div className="h-1 w-6 rounded bg-neutral-700" />
                <div className="h-1 w-full rounded bg-neutral-800" />
              </div>
            </div>
          </div>
        </div>
      );
    case "poster":
      return (
        <div className={`${base} flex`}>
          <div className="w-1 shrink-0 bg-[#fafafa]/60" />
          <div className="flex flex-1 flex-col justify-center gap-1 p-2">
            <div className="h-2 w-10 rounded bg-neutral-700" />
            <div className="h-1 w-6 rounded bg-neutral-800" />
            <div className="mt-1 h-1 w-full rounded bg-neutral-800/80" />
          </div>
        </div>
      );
    case "glass":
      return (
        <div className="relative h-16 w-full overflow-hidden rounded-md border border-white/15 bg-white/[0.04]">
          <div className="absolute -left-2 -top-2 h-8 w-8 rounded-full bg-[#fafafa]/30 blur-md" />
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#fafafa]/20 blur-md" />
          <div className="relative flex flex-col items-center justify-center gap-1 py-2">
            <div className="h-4 w-4 rounded-full bg-neutral-700/80" />
            <div className="h-1 w-8 rounded bg-neutral-700/80" />
          </div>
        </div>
      );
    default:
      return (
        <div className={`${base} p-2`}>
          <div className="h-1.5 w-10 rounded bg-neutral-700" />
          <div className="mt-2 h-1 w-full rounded bg-neutral-800" />
        </div>
      );
  }
}

export function ThemesEditor({ settings }: { settings: ProfileSettings }) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initial);
  const [selected, setSelected] = useState<ProfileLayout>(settings.layout);
  useSettingsRefresh(state);
  const { markDirty } = useUnsavedChanges();

  useEffect(() => {
    setSelected(settings.layout);
  }, [settings.updated_at, settings.layout]);

  return (
    <>
      <PageHeader title="Layouts" description="Choose how your public profile is structured." />
      <div className={cardClassName}>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="_section" value="themes" />
          <input type="hidden" name="layout" value={selected} />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {LAYOUT_OPTIONS.map((layout) => {
              const isActive = selected === layout.value;
              return (
                <button
                  key={layout.value}
                  type="button"
                  onClick={() => {
                    setSelected(layout.value);
                    markDirty();
                  }}
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

          <FormFeedback error={state.error} success={state.success} />
          <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
            {isPending ? "Saving..." : "Save layout"}
          </button>
        </form>
      </div>
    </>
  );
}

export function ThemesPageShell({ settings }: { settings: ProfileSettings }) {
  return <ThemesEditor settings={settings} />;
}
