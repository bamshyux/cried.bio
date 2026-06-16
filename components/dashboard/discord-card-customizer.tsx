"use client";

import { useState } from "react";
import { DiscordStatusCard } from "@/components/profile/public/discord-status-card";
import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import { labelClassName, ToggleField } from "@/components/dashboard/form-fields";
import {
  getDiscordAvatarShapeLabel,
  getDiscordAvatarSizeLabel,
  getDiscordCardAlignLabel,
  getDiscordCardStyleLabel,
  getDiscordCardThemeLabel,
  getDiscordHeaderLayoutLabel,
  getDiscordTextAlignLabel,
} from "@/lib/discord/card-config";
import { FONT_OPTIONS } from "@/lib/settings";
import { DEFAULT_DISCORD_CARD_CONFIG } from "@/lib/types/discord-widget";
import type {
  DiscordAvatarShape,
  DiscordAvatarSize,
  DiscordCardAlign,
  DiscordCardConfig,
  DiscordCardRadius,
  DiscordCardStyle,
  DiscordCardTheme,
  DiscordCardWidth,
  DiscordHeaderLayout,
  DiscordTextAlign,
} from "@/lib/types/discord-widget";
import type { DiscordPresence } from "@/lib/discord/types";
import type { ProfileSettings } from "@/lib/types/settings";

const STYLES: DiscordCardStyle[] = ["discord", "minimal", "compact", "pill"];
const THEMES: DiscordCardTheme[] = ["discord_dark", "glass", "neon", "accent", "midnight"];
const RADII: DiscordCardRadius[] = ["sharp", "soft", "round", "pill"];
const WIDTHS: DiscordCardWidth[] = ["narrow", "default", "wide", "full"];
const HEADER_LAYOUTS: DiscordHeaderLayout[] = ["row", "centered", "stacked"];
const TEXT_ALIGNS: DiscordTextAlign[] = ["left", "center", "right"];
const CARD_ALIGNS: DiscordCardAlign[] = ["inherit", "left", "center", "right"];
const AVATAR_SIZES: DiscordAvatarSize[] = ["small", "medium", "large", "xlarge"];
const AVATAR_SHAPES: DiscordAvatarShape[] = ["circle", "rounded", "square"];

function ColorField({
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

function ChipGrid<T extends string>({
  options,
  value,
  label,
  getLabel,
  onChange,
  disabled,
}: {
  options: T[];
  value: T;
  label: string;
  getLabel: (option: T) => string;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className={labelClassName}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
              value === option
                ? "border-[#5865F2]/60 bg-[#5865F2]/15 text-white"
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

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{children}</p>
  );
}

export function DiscordCardCustomizer({
  settings,
  config,
  previewPresence,
  disabled,
  onChange,
}: {
  settings: ProfileSettings;
  config: DiscordCardConfig;
  previewPresence: DiscordPresence;
  disabled?: boolean;
  onChange: (config: DiscordCardConfig) => void;
}) {
  const [previewActivity, setPreviewActivity] = useState(true);

  const patch = (partial: Partial<DiscordCardConfig>) => onChange({ ...config, ...partial });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SectionTitle>Card style</SectionTitle>
        <ChipGrid
          label="Layout preset"
          options={STYLES}
          value={config.style}
          getLabel={getDiscordCardStyleLabel}
          onChange={(style) => patch({ style })}
          disabled={disabled}
        />
        <ChipGrid
          label="Theme"
          options={THEMES}
          value={config.theme}
          getLabel={getDiscordCardThemeLabel}
          onChange={(theme) => patch({ theme })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-4">
        <SectionTitle>Layout &amp; position</SectionTitle>
        <ChipGrid
          label="Header layout"
          options={HEADER_LAYOUTS}
          value={config.header_layout}
          getLabel={getDiscordHeaderLayoutLabel}
          onChange={(header_layout) => patch({ header_layout })}
          disabled={disabled}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ChipGrid
            label="Text alignment"
            options={TEXT_ALIGNS}
            value={config.text_align}
            getLabel={getDiscordTextAlignLabel}
            onChange={(text_align) => patch({ text_align })}
            disabled={disabled}
          />
          <ChipGrid
            label="Card position"
            options={CARD_ALIGNS}
            value={config.card_align}
            getLabel={getDiscordCardAlignLabel}
            onChange={(card_align) => patch({ card_align })}
            disabled={disabled}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName}>Header gap — {config.header_gap}px</label>
            <input
              type="range"
              min={4}
              max={32}
              value={config.header_gap}
              onChange={(e) => patch({ header_gap: Number(e.target.value) })}
              disabled={disabled}
              className="w-full accent-[#5865F2]"
            />
          </div>
          <div>
            <label className={labelClassName}>Horizontal padding — {config.padding_x}px</label>
            <input
              type="range"
              min={0}
              max={32}
              value={config.padding_x}
              onChange={(e) => patch({ padding_x: Number(e.target.value) })}
              disabled={disabled}
              className="w-full accent-[#5865F2]"
            />
          </div>
        </div>
        <div>
          <label className={labelClassName}>
            Vertical padding — {config.padding_y > 0 ? `${config.padding_y}px` : "Auto"}
          </label>
          <input
            type="range"
            min={0}
            max={32}
            value={config.padding_y}
            onChange={(e) => patch({ padding_y: Number(e.target.value) })}
            disabled={disabled}
            className="w-full accent-[#5865F2]"
          />
        </div>
      </div>

      <div className="space-y-4">
        <SectionTitle>Avatar</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <ChipGrid
            label="Avatar size"
            options={AVATAR_SIZES}
            value={config.avatar_size}
            getLabel={getDiscordAvatarSizeLabel}
            onChange={(avatar_size) => patch({ avatar_size })}
            disabled={disabled}
          />
          <ChipGrid
            label="Avatar shape"
            options={AVATAR_SHAPES}
            value={config.avatar_shape}
            getLabel={getDiscordAvatarShapeLabel}
            onChange={(avatar_shape) => patch({ avatar_shape })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-4">
        <SectionTitle>Typography &amp; colors</SectionTitle>
        <ControlledSelect
          label="Font"
          value={config.font_family}
          onChange={(font_family) => patch({ font_family })}
          options={[
            { value: "", label: "Default" },
            ...FONT_OPTIONS.map((font) => ({ value: font.value, label: font.label })),
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName}>
              Name size — {config.name_font_size > 0 ? `${config.name_font_size}px` : "Auto"}
            </label>
            <input
              type="range"
              min={0}
              max={28}
              value={config.name_font_size}
              onChange={(e) => patch({ name_font_size: Number(e.target.value) })}
              disabled={disabled}
              className="w-full accent-[#5865F2]"
            />
          </div>
          <div>
            <label className={labelClassName}>
              Status size — {config.status_font_size > 0 ? `${config.status_font_size}px` : "Auto"}
            </label>
            <input
              type="range"
              min={0}
              max={22}
              value={config.status_font_size}
              onChange={(e) => patch({ status_font_size: Number(e.target.value) })}
              disabled={disabled}
              className="w-full accent-[#5865F2]"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            label="Primary text"
            value={config.primary_text_color}
            fallback="#f2f3f5"
            onChange={(primary_text_color) => patch({ primary_text_color })}
          />
          <ColorField
            label="Secondary text"
            value={config.secondary_text_color}
            fallback="#b5bac1"
            onChange={(secondary_text_color) => patch({ secondary_text_color })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <SectionTitle>Card colors &amp; shape</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            label="Accent"
            value={config.accent_color}
            fallback={settings.accent_color || "#5865F2"}
            onChange={(accent_color) => patch({ accent_color })}
          />
          <ColorField
            label="Background"
            value={config.background_color}
            fallback="#2b2d31"
            onChange={(background_color) => patch({ background_color })}
          />
          <ColorField
            label="Border"
            value={config.border_color}
            fallback="#1e1f22"
            onChange={(border_color) => patch({ border_color })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName}>
              Background opacity — {config.background_opacity}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={config.background_opacity}
              onChange={(e) => patch({ background_opacity: Number(e.target.value) })}
              disabled={disabled}
              className="w-full accent-[#5865F2]"
            />
          </div>
          <div>
            <label className={labelClassName}>Border width — {config.border_width}px</label>
            <input
              type="range"
              min={0}
              max={3}
              value={config.border_width}
              onChange={(e) => patch({ border_width: Number(e.target.value) })}
              disabled={disabled}
              className="w-full accent-[#5865F2]"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ChipGrid
            label="Corner radius"
            options={RADII}
            value={config.border_radius}
            getLabel={(r) => r.charAt(0).toUpperCase() + r.slice(1)}
            onChange={(border_radius) => patch({ border_radius })}
            disabled={disabled}
          />
          <ChipGrid
            label="Card width"
            options={WIDTHS}
            value={config.card_width}
            getLabel={(w) => (w === "default" ? "Default" : w.charAt(0).toUpperCase() + w.slice(1))}
            onChange={(card_width) => patch({ card_width })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>Visibility</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleField
            key={`avatar-${String(config.show_avatar)}`}
            name="discord_show_avatar"
            label="Show avatar"
            description="Display your Discord profile picture."
            defaultChecked={config.show_avatar}
            onCheckedChange={(show_avatar) => patch({ show_avatar })}
          />
          <ToggleField
            key={`status-dot-${String(config.show_status_dot)}`}
            name="discord_show_status_dot"
            label="Show status dot"
            description="Green/yellow/red dot on the avatar."
            defaultChecked={config.show_status_dot}
            onCheckedChange={(show_status_dot) => patch({ show_status_dot })}
          />
          <ToggleField
            key={`status-${String(config.show_status_text)}`}
            name="discord_show_status"
            label="Show status text"
            description="Online, idle, DND, or offline label."
            defaultChecked={config.show_status_text}
            onCheckedChange={(show_status_text) => patch({ show_status_text })}
          />
          <ToggleField
            key={`activity-${String(config.show_activity)}`}
            name="discord_show_activity"
            label="Show activity"
            description="Games, Spotify, and custom status blocks."
            defaultChecked={config.show_activity}
            onCheckedChange={(show_activity) => patch({ show_activity })}
          />
          <ToggleField
            key={`hint-${String(config.show_lanyard_hint)}`}
            name="discord_show_lanyard_hint"
            label="Show Lanyard setup hint"
            description="Small note when offline with no activity."
            defaultChecked={config.show_lanyard_hint}
            onCheckedChange={(show_lanyard_hint) => patch({ show_lanyard_hint })}
          />
          <ToggleField
            key={`glow-${String(config.glow)}`}
            name="discord_glow"
            label="Accent glow"
            description="Soft outer glow using your accent color."
            defaultChecked={config.glow}
            onCheckedChange={(glow) => patch({ glow })}
          />
          <ToggleField
            key={`blur-${String(config.backdrop_blur)}`}
            name="discord_blur"
            label="Backdrop blur"
            description="Frosted glass effect behind the card."
            defaultChecked={config.backdrop_blur}
            onCheckedChange={(backdrop_blur) => patch({ backdrop_blur })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...DEFAULT_DISCORD_CARD_CONFIG })}
          className="text-xs text-neutral-500 hover:text-white disabled:opacity-50"
        >
          Reset to defaults
        </button>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-400">
          <input
            type="checkbox"
            checked={previewActivity}
            onChange={(e) => setPreviewActivity(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-[#090909] accent-[#5865F2]"
          />
          Preview sample activity
        </label>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0a] p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          Preview
        </p>
        <DiscordStatusCard
          presence={previewPresence}
          settings={settings}
          config={config}
          live={false}
          previewActivity={previewActivity}
        />
      </div>
    </div>
  );
}
