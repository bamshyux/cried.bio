"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { updateEmbedConfigAction } from "@/app/actions/embeds";
import { ProfileEmbedItem } from "@/components/profile/public/profile-embed-item";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  inputClassName,
  labelClassName,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import {
  DASHBOARD_RESET_EVENT,
  useUnsavedChangesOptional,
} from "@/components/dashboard/unsaved-changes";
import type {
  EmbedAlignment,
  EmbedAspectRatio,
  EmbedCardStyle,
  EmbedConfig,
  EmbedDisplayMode,
  EmbedTheme,
  EmbedType,
  ProfileEmbed,
} from "@/lib/types/embed";
import type { ProfileSettings } from "@/lib/types/settings";

function ChipGrid<T extends string>({
  label,
  options,
  value,
  getLabel,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  getLabel: (option: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className={labelClassName}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              value === option
                ? "border-[#fafafa]/40 bg-[#fafafa]/10 text-white"
                : "border-white/[0.08] bg-[#0f0f0f] text-neutral-400 hover:border-white/15 hover:text-white"
            }`}
          >
            {getLabel(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorInput({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className={labelClassName}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-white/[0.08] bg-[#141414]"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Auto (${fallback})`}
          className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-3 py-2 text-xs text-white placeholder:text-neutral-600"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 text-[10px] uppercase tracking-wide text-neutral-500 hover:text-white"
          >
            Auto
          </button>
        ) : null}
      </div>
    </div>
  );
}

const DISPLAY_LABELS: Record<EmbedDisplayMode, string> = {
  iframe: "Player",
  card: "Card",
  minimal: "Link",
};

const ASPECT_LABELS: Record<EmbedAspectRatio, string> = {
  "16:9": "16:9",
  "4:3": "4:3",
  "1:1": "Square",
  "9:16": "Vertical",
  auto: "Compact",
};

const STYLE_LABELS: Record<EmbedCardStyle, string> = {
  default: "Default",
  minimal: "Minimal",
  glass: "Glass",
  bordered: "Accent border",
};

const ALIGN_LABELS: Record<EmbedAlignment, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
  stretch: "Full width",
};

function configsEqual(a: EmbedConfig, b: EmbedConfig) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const TITLE_SIZE_LABELS = {
  sm: "Small",
  md: "Medium",
  lg: "Large",
} as const;

function isMediaEmbed(type: EmbedType) {
  return type === "youtube" || type === "twitch" || type === "tiktok" || type === "discord";
}

function isAudioEmbed(type: EmbedType) {
  return type === "spotify_track" || type === "spotify_playlist" || type === "soundcloud";
}

function isRoblox(type: EmbedType) {
  return type === "roblox" || type === "roblox_profile";
}

function isLetterboxd(type: EmbedType) {
  return type === "letterboxd";
}

function isProfileLinkCard(type: EmbedType) {
  return isRoblox(type) || isLetterboxd(type);
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-white/[0.06] pb-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">{title}</p>
      {description ? <p className="mt-1 text-xs text-neutral-600">{description}</p> : null}
    </div>
  );
}

export function EmbedCustomizer({
  embed,
  settings,
}: {
  embed: ProfileEmbed;
  settings: ProfileSettings;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const unsaved = useUnsavedChangesOptional();
  const [savedConfig, setSavedConfig] = useState<EmbedConfig>(embed.config);
  const [config, setConfig] = useState<EmbedConfig>(embed.config);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSavedConfig(embed.config);
    setConfig(embed.config);
    setStatus("idle");
  }, [embed.config]);

  useEffect(() => {
    const handleDashboardReset = () => {
      setConfig(savedConfig);
      setStatus("idle");
    };
    window.addEventListener(DASHBOARD_RESET_EVENT, handleDashboardReset);
    return () => window.removeEventListener(DASHBOARD_RESET_EVENT, handleDashboardReset);
  }, [savedConfig]);

  const isDirty = useMemo(() => !configsEqual(config, savedConfig), [config, savedConfig]);

  const markDirtyForm = () => {
    unsaved?.markDirty();
    if (formRef.current) unsaved?.setLastDirtyForm(formRef.current);
  };

  const updateDraft = (partial: Partial<EmbedConfig>) => {
    setConfig((current) => ({ ...current, ...partial }));
    setStatus("idle");
    markDirtyForm();
  };

  const handleReset = () => {
    setConfig(savedConfig);
    setStatus("idle");
    unsaved?.markClean();
  };

  const handleSave = () => {
    if (!isDirty || isPending) return;

    unsaved?.markSaving();
    startTransition(async () => {
      const result = await updateEmbedConfigAction(embed.id, config);
      if (result.error) {
        setStatus("error");
        unsaved?.clearSaving();
        return;
      }
      if (result.config) {
        setSavedConfig(result.config);
        setConfig(result.config);
      }
      setStatus("saved");
      unsaved?.markClean();
    });
  };

  const displayOptions: EmbedDisplayMode[] = isProfileLinkCard(embed.embed_type)
    ? ["card", "minimal"]
    : isMediaEmbed(embed.embed_type) || isAudioEmbed(embed.embed_type) || embed.embed_type === "discord"
      ? ["iframe", "card", "minimal"]
      : ["iframe", "card"];

  const aspectOptions: EmbedAspectRatio[] =
    embed.embed_type === "tiktok"
      ? ["9:16", "16:9", "auto"]
      : isAudioEmbed(embed.embed_type)
        ? ["auto", "16:9"]
        : ["16:9", "4:3", "1:1", "auto"];

  return (
    <form
      ref={formRef}
      data-dashboard-section-form="embed-customizer"
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"
    >
      <div className="space-y-6">
        <section className="space-y-4">
          <SectionHeading title="Content" description="Text shown above or inside the embed card." />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>Custom title</label>
              <input
                type="text"
                value={config.custom_title}
                onChange={(e) => updateDraft({ custom_title: e.target.value })}
                placeholder={embed.title}
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Description</label>
              <input
                type="text"
                value={config.description}
                onChange={(e) => updateDraft({ description: e.target.value })}
                placeholder="Optional subtitle or caption"
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              name={`show_title_${embed.id}`}
              label="Show title on profile"
              checked={config.show_title}
              onCheckedChange={(show_title) => updateDraft({ show_title })}
            />
            <ToggleField
              name={`show_description_${embed.id}`}
              label="Show description"
              checked={config.show_description}
              onCheckedChange={(show_description) => updateDraft({ show_description })}
            />
          </div>

          <ChipGrid
            label="Title size"
            options={["sm", "md", "lg"] as const}
            value={config.title_size}
            getLabel={(option) => TITLE_SIZE_LABELS[option]}
            onChange={(title_size) => updateDraft({ title_size })}
          />
        </section>

        <section className="space-y-4">
          <SectionHeading title="Layout" description="How the embed is displayed on your profile." />

        <ChipGrid
          label="Display style"
          options={displayOptions}
          value={config.display_mode}
          getLabel={(option) => DISPLAY_LABELS[option]}
          onChange={(display_mode) => updateDraft({ display_mode })}
        />

        {config.display_mode === "iframe" ? (
          <ChipGrid
            label="Player size"
            options={aspectOptions}
            value={config.aspect_ratio}
            getLabel={(option) => ASPECT_LABELS[option]}
            onChange={(aspect_ratio) => updateDraft({ aspect_ratio })}
          />
        ) : null}

        {config.display_mode === "card" ? (
          <ChipGrid
            label="Card style"
            options={["default", "minimal", "glass", "bordered"] as const}
            value={config.card_style}
            getLabel={(option) => STYLE_LABELS[option]}
            onChange={(card_style) => updateDraft({ card_style })}
          />
        ) : null}

        <ChipGrid
          label="Alignment"
          options={["stretch", "left", "center", "right"] as const}
          value={config.alignment}
          getLabel={(option) => ALIGN_LABELS[option]}
          onChange={(alignment) => updateDraft({ alignment })}
        />

        {config.alignment !== "stretch" ? (
          <SliderField
            name={`max_width_${embed.id}`}
            label="Max width"
            min={50}
            max={100}
            value={config.max_width}
            onChange={(max_width) => updateDraft({ max_width })}
            unit="%"
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <SliderField
            name={`padding_${embed.id}`}
            label="Inner padding"
            min={0}
            max={32}
            value={config.padding}
            onChange={(padding) => updateDraft({ padding })}
            unit="px"
          />
          <SliderField
            name={`margin_y_${embed.id}`}
            label="Vertical spacing"
            min={0}
            max={48}
            value={config.margin_y}
            onChange={(margin_y) => updateDraft({ margin_y })}
            unit="px"
          />
        </div>
        </section>

        <section className="space-y-4">
          <SectionHeading title="Appearance" description="Colors, opacity, blur, borders, and shadows." />

        <div className="grid gap-4 sm:grid-cols-2">
          <ColorInput
            label="Accent color"
            value={config.accent_color}
            fallback={settings.accent_color}
            onChange={(accent_color) => updateDraft({ accent_color })}
          />
          <ColorInput
            label="Background"
            value={config.background_color}
            fallback="#0f0f0f"
            onChange={(background_color) => updateDraft({ background_color })}
          />
          <ColorInput
            label="Text color"
            value={config.text_color}
            fallback={settings.text_color}
            onChange={(text_color) => updateDraft({ text_color })}
          />
          <ColorInput
            label="Border color"
            value={config.border_color}
            fallback="rgba(255,255,255,0.08)"
            onChange={(border_color) => updateDraft({ border_color })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SliderField
            name={`opacity_${embed.id}`}
            label="Opacity"
            min={0}
            max={100}
            value={config.opacity}
            onChange={(opacity) => updateDraft({ opacity })}
            unit="%"
          />
          <SliderField
            name={`blur_${embed.id}`}
            label="Blur"
            min={0}
            max={40}
            value={config.blur}
            onChange={(blur) => updateDraft({ blur })}
            unit="px"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SliderField
            name={`radius_${embed.id}`}
            label="Corner radius"
            min={0}
            max={24}
            value={config.border_radius}
            onChange={(border_radius) => updateDraft({ border_radius })}
            unit="px"
          />
          <SliderField
            name={`border_width_${embed.id}`}
            label="Border width"
            min={0}
            max={4}
            value={config.border_width}
            onChange={(border_width) => updateDraft({ border_width })}
            unit="px"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleField
            name={`border_${embed.id}`}
            label="Show border"
            checked={config.show_border}
            onCheckedChange={(show_border) => updateDraft({ show_border })}
          />
          <ToggleField
            name={`shadow_${embed.id}`}
            label="Drop shadow"
            checked={config.show_shadow}
            onCheckedChange={(show_shadow) => updateDraft({ show_shadow })}
          />
        </div>
        </section>

        <section className="space-y-4">
          <SectionHeading title="Embed options" description="Type-specific player and card settings." />

        {(embed.embed_type === "roblox_profile" || embed.embed_type === "letterboxd") ? (
          <>
            <ToggleField
              name={`show_avatar_${embed.id}`}
              label="Show avatar"
              description={
                embed.embed_type === "letterboxd"
                  ? "Display the Letterboxd profile photo on the card."
                  : "Display the Roblox headshot on the card."
              }
              checked={config.show_avatar}
              onCheckedChange={(show_avatar) => updateDraft({ show_avatar })}
            />
            <ToggleField
              name={`show_username_${embed.id}`}
              label="Show username"
              checked={config.show_username}
              onCheckedChange={(show_username) => updateDraft({ show_username })}
            />
          </>
        ) : null}

        {embed.embed_type === "letterboxd" ? (
          <ToggleField
            name={`show_stats_${embed.id}`}
            label="Show profile stats"
            description="Film count, followers, and following when available."
            checked={config.show_stats}
            onCheckedChange={(show_stats) => updateDraft({ show_stats })}
          />
        ) : null}

        {embed.embed_type === "roblox" ? (
          <ToggleField
            name={`show_thumbnail_${embed.id}`}
            label="Show game thumbnail"
            checked={config.show_thumbnail}
            onCheckedChange={(show_thumbnail) => updateDraft({ show_thumbnail })}
          />
        ) : null}

        {isAudioEmbed(embed.embed_type) ? (
          <ToggleField
            name={`compact_${embed.id}`}
            label="Compact player"
            description="Use a shorter player instead of a wide video frame."
            checked={config.compact_player}
            onCheckedChange={(compact_player) =>
              updateDraft({ compact_player, aspect_ratio: compact_player ? "auto" : "16:9" })
            }
          />
        ) : null}

        {(embed.embed_type === "discord" || isAudioEmbed(embed.embed_type)) && config.display_mode === "iframe" ? (
          <ChipGrid
            label="Theme"
            options={["dark", "light"] as const}
            value={config.theme}
            getLabel={(option: EmbedTheme) => (option === "dark" ? "Dark" : "Light")}
            onChange={(theme) => updateDraft({ theme })}
          />
        ) : null}

        {embed.embed_type === "youtube" && config.display_mode === "iframe" ? (
          <ToggleField
            name={`autoplay_${embed.id}`}
            label="Autoplay"
            checked={config.autoplay}
            onCheckedChange={(autoplay) => updateDraft({ autoplay })}
          />
        ) : null}
        </section>

        <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isPending}
            className={buttonPrimaryClassName}
          >
            {isPending ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || isPending}
            className={buttonSecondaryClassName}
          >
            Reset
          </button>
          {isDirty && !isPending ? (
            <p className="text-xs text-amber-400/90">Unsaved changes</p>
          ) : null}
          {status === "saved" && !isDirty ? (
            <p className="text-xs text-emerald-400">Saved</p>
          ) : null}
          {status === "error" ? (
            <p className="text-xs text-red-400">Could not save changes.</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#090909] p-4">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-neutral-500">Preview</p>
        <ProfileEmbedItem embed={{ ...embed, config }} settings={settings} hostname="localhost" />
      </div>

      <button
        type="submit"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={!isDirty || isPending}
      >
        Save embed changes
      </button>
    </form>
  );
}
