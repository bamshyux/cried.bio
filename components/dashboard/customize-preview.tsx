"use client";

import { useMemo } from "react";
import { ProfileStatusLine } from "@/components/profile/public/profile-social";
import {
  buildCardStyle,
  FONT_OPTIONS,
  getFontCss,
  getGoogleFontsUrl,
  getProfileAlignClass,
} from "@/lib/settings";
import type { ContentAlignment, ProfileSettings } from "@/lib/types/settings";

export type CustomizeFormState = {
  accent_color: string;
  text_color: string;
  font_family: string;
  content_alignment: ContentAlignment;
  layout_label: string;
  border_radius: number;
  profile_opacity: number;
  profile_blur: number;
  glassmorphism: boolean;
  neon_glow: boolean;
  hide_card_border: boolean;
  show_view_count: boolean;
  show_join_date: boolean;
  profile_parallax: boolean;
  profile_status: string;
  profile_status_use_accent: boolean;
  profile_status_color: string;
};

function mergePreviewSettings(
  base: ProfileSettings,
  form: CustomizeFormState,
): ProfileSettings {
  return {
    ...base,
    accent_color: form.accent_color,
    text_color: form.text_color,
    font_family: form.font_family,
    content_alignment: form.content_alignment,
    layout_label: form.layout_label,
    border_radius: form.border_radius,
    profile_opacity: form.profile_opacity,
    profile_blur: form.profile_blur,
    glassmorphism: form.glassmorphism,
    neon_glow: form.neon_glow,
    hide_card_border: form.hide_card_border,
    show_view_count: form.show_view_count,
    show_join_date: form.show_join_date,
    profile_status: form.profile_status,
    profile_status_color: form.profile_status_use_accent ? "" : form.profile_status_color,
  };
}

export function CustomizePreview({
  settings,
  form,
}: {
  settings: ProfileSettings;
  form: CustomizeFormState;
}) {
  const preview = useMemo(() => mergePreviewSettings(settings, form), [settings, form]);
  const fontCss = getFontCss(preview.font_family);
  const fontUrl = getGoogleFontsUrl(preview.font_family);
  const fontLabel =
    FONT_OPTIONS.find((option) => option.value === preview.font_family)?.label ??
    preview.font_family;
  const cardStyle = buildCardStyle(preview);
  const alignClass = getProfileAlignClass(preview.content_alignment);
  const usernameGlow = preview.neon_glow
    ? { textShadow: `0 0 24px ${preview.accent_color}80` }
    : undefined;

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0a]">
      {fontUrl ? <link rel="stylesheet" href={fontUrl} /> : null}

      <div className="border-b border-white/[0.06] px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Live preview</p>
        <p className="mt-1 text-xs text-neutral-400">
          Font: <span className="font-medium text-neutral-200">{fontLabel}</span>
        </p>
      </div>

      <div
        className="relative p-5"
        style={{
          background:
            "linear-gradient(135deg, #1a1030 0%, #0c1929 45%, #141414 100%)",
        }}
      >
        {preview.glassmorphism ? (
          <>
            <div
              className="pointer-events-none absolute left-4 top-4 h-20 w-20 rounded-full opacity-50 blur-2xl"
              style={{ background: preview.accent_color }}
            />
            <div
              className="pointer-events-none absolute bottom-6 right-4 h-16 w-16 rounded-full opacity-35 blur-2xl"
              style={{ background: "#38bdf8" }}
            />
          </>
        ) : null}

        <div
          className={`relative mx-auto w-full max-w-[280px] ${alignClass}`}
          style={
            {
              color: preview.text_color,
              fontFamily: fontCss,
              "--bf-accent": preview.accent_color,
            } as React.CSSProperties
          }
        >
          <div className="p-4" style={cardStyle as React.CSSProperties}>
            <div className="bf-profile-avatar-row mb-3 flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-[#090909]"
                style={{
                  background: preview.accent_color,
                  boxShadow: `0 0 0 2px ${preview.accent_color}40`,
                }}
              >
                Y
              </div>
              <div className="min-w-0">
                <p
                  className="truncate text-lg font-semibold leading-tight"
                  style={usernameGlow}
                >
                  Your Name
                </p>
                <p className="truncate text-sm opacity-60">@username</p>
              </div>
            </div>

            <ProfileStatusLine settings={preview} />

            {(preview.show_view_count || preview.show_join_date) && (
              <div className="bf-profile-row mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-60">
                {preview.show_view_count ? <span>128 views</span> : null}
                {preview.show_join_date ? <span>Joined Jun 2026</span> : null}
              </div>
            )}

            <p className="bf-profile-block mb-3 text-sm leading-relaxed opacity-85">
              The quick brown fox jumps over the lazy dog.
            </p>
            <p className="bf-profile-block mb-4 text-xs leading-relaxed opacity-55">
              ABCDEFGHIJKLM abcdefghijklm 0123456789
            </p>

            <div
              className="bf-profile-block rounded-lg border px-3 py-2.5 text-sm transition-colors"
              style={{
                borderColor: `${preview.accent_color}35`,
                backgroundColor: `${preview.accent_color}12`,
              }}
            >
              Sample link
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
