"use client";

import { useEffect, useState, useTransition } from "react";
import { updateEmbedConfigAction } from "@/app/actions/embeds";
import { ProfileEmbedItem } from "@/components/profile/public/profile-embed-item";
import {
  inputClassName,
  labelClassName,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
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
  onCommit,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
  onCommit?: (value: string) => void;
}) {
  return (
    <div>
      <label className={labelClassName}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || fallback}
          onChange={(e) => {
            onChange(e.target.value);
            onCommit?.(e.target.value);
          }}
          className="h-10 w-12 cursor-pointer rounded-lg border border-white/[0.08] bg-[#141414]"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onCommit?.(value)}
          placeholder={`Auto (${fallback})`}
          className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-3 py-2 text-xs text-white placeholder:text-neutral-600"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              onCommit?.("");
            }}
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

function isMediaEmbed(type: EmbedType) {
  return type === "youtube" || type === "twitch" || type === "tiktok" || type === "discord";
}

function isAudioEmbed(type: EmbedType) {
  return type === "spotify_track" || type === "spotify_playlist" || type === "soundcloud";
}

function isRoblox(type: EmbedType) {
  return type === "roblox" || type === "roblox_profile";
}

export function EmbedCustomizer({
  embed,
  settings,
}: {
  embed: ProfileEmbed;
  settings: ProfileSettings;
}) {
  const [config, setConfig] = useState<EmbedConfig>(embed.config);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setConfig(embed.config);
  }, [embed.config]);

  const patch = (partial: Partial<EmbedConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    setStatus("idle");
    startTransition(async () => {
      const result = await updateEmbedConfigAction(embed.id, partial);
      if (result.error) {
        setStatus("error");
        return;
      }
      if (result.config) setConfig(result.config);
      setStatus("saved");
    });
  };

  const displayOptions: EmbedDisplayMode[] = isRoblox(embed.embed_type)
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName}>Custom title</label>
            <input
              type="text"
              value={config.custom_title}
              onChange={(e) => setConfig({ ...config, custom_title: e.target.value })}
              onBlur={() => patch({ custom_title: config.custom_title })}
              placeholder={embed.title}
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName}>Description</label>
            <input
              type="text"
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              onBlur={() => patch({ description: config.description })}
              placeholder="Optional subtitle or caption"
              className={inputClassName}
            />
          </div>
        </div>

        <ToggleField
          name={`show_title_${embed.id}`}
          label="Show title on profile"
          checked={config.show_title}
          onCheckedChange={(checked) => patch({ show_title: checked })}
        />

        <ChipGrid
          label="Display style"
          options={displayOptions}
          value={config.display_mode}
          getLabel={(option) => DISPLAY_LABELS[option]}
          onChange={(display_mode) => patch({ display_mode })}
        />

        {config.display_mode === "iframe" ? (
          <ChipGrid
            label="Player size"
            options={aspectOptions}
            value={config.aspect_ratio}
            getLabel={(option) => ASPECT_LABELS[option]}
            onChange={(aspect_ratio) => patch({ aspect_ratio })}
          />
        ) : null}

        {config.display_mode === "card" ? (
          <ChipGrid
            label="Card style"
            options={["default", "minimal", "glass", "bordered"] as const}
            value={config.card_style}
            getLabel={(option) => STYLE_LABELS[option]}
            onChange={(card_style) => patch({ card_style })}
          />
        ) : null}

        <ChipGrid
          label="Alignment"
          options={["stretch", "left", "center", "right"] as const}
          value={config.alignment}
          getLabel={(option) => ALIGN_LABELS[option]}
          onChange={(alignment) => patch({ alignment })}
        />

        {embed.embed_type === "roblox_profile" ? (
          <>
            <ToggleField
              name={`show_avatar_${embed.id}`}
              label="Show avatar"
              description="Display the Roblox headshot on the card."
              checked={config.show_avatar}
              onCheckedChange={(show_avatar) => patch({ show_avatar })}
            />
            <ToggleField
              name={`show_username_${embed.id}`}
              label="Show username"
              checked={config.show_username}
              onCheckedChange={(show_username) => patch({ show_username })}
            />
          </>
        ) : null}

        {embed.embed_type === "roblox" ? (
          <ToggleField
            name={`show_thumbnail_${embed.id}`}
            label="Show game thumbnail"
            checked={config.show_thumbnail}
            onCheckedChange={(show_thumbnail) => patch({ show_thumbnail })}
          />
        ) : null}

        {isAudioEmbed(embed.embed_type) ? (
          <ToggleField
            name={`compact_${embed.id}`}
            label="Compact player"
            description="Use a shorter player instead of a wide video frame."
            checked={config.compact_player}
            onCheckedChange={(compact_player) =>
              patch({ compact_player, aspect_ratio: compact_player ? "auto" : "16:9" })
            }
          />
        ) : null}

        {(embed.embed_type === "discord" || isAudioEmbed(embed.embed_type)) && config.display_mode === "iframe" ? (
          <ChipGrid
            label="Theme"
            options={["dark", "light"] as const}
            value={config.theme}
            getLabel={(option: EmbedTheme) => (option === "dark" ? "Dark" : "Light")}
            onChange={(theme) => patch({ theme })}
          />
        ) : null}

        {embed.embed_type === "youtube" && config.display_mode === "iframe" ? (
          <ToggleField
            name={`autoplay_${embed.id}`}
            label="Autoplay"
            checked={config.autoplay}
            onCheckedChange={(autoplay) => patch({ autoplay })}
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <ColorInput
            label="Accent color"
            value={config.accent_color}
            fallback={settings.accent_color}
            onChange={(accent_color) => setConfig({ ...config, accent_color })}
            onCommit={(accent_color) => patch({ accent_color })}
          />
          <ColorInput
            label="Background"
            value={config.background_color}
            fallback="#0f0f0f"
            onChange={(background_color) => setConfig({ ...config, background_color })}
            onCommit={(background_color) => patch({ background_color })}
          />
        </div>

        <SliderField
          name={`radius_${embed.id}`}
          label="Corner radius"
          min={0}
          max={24}
          value={config.border_radius}
          onChange={(border_radius) => patch({ border_radius })}
        />

        <ToggleField
          name={`border_${embed.id}`}
          label="Show border"
          checked={config.show_border}
          onCheckedChange={(show_border) => patch({ show_border })}
        />

        {status === "saved" ? <p className="text-xs text-emerald-400">Saved</p> : null}
        {status === "error" ? <p className="text-xs text-red-400">Could not save changes.</p> : null}
        {isPending ? <p className="text-xs text-neutral-500">Saving...</p> : null}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#090909] p-4">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-neutral-500">Preview</p>
        <ProfileEmbedItem embed={{ ...embed, config }} settings={settings} hostname="localhost" />
      </div>
    </div>
  );
}
