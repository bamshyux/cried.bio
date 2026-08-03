"use client";

import { useMemo } from "react";
import { buildCardStyles, getProfileAlignClass } from "@/lib/settings";
import { getFontCss, getFontLabel, getFontStylesheetUrl } from "@/lib/font-utils";
import { writeContentPageBorderTargets } from "@/lib/card-border-effects/resolve";
import { ProfileBio } from "@/components/profile/public/profile-bio";
import { CardBorderEffect } from "@/components/profile/card-border-effect";
import type { ProfilePage } from "@/lib/profile-pages/slug";
import type { ContentAlignment, ProfileSettings, CardBorderEffectPreset } from "@/lib/types/settings";

export type ContentPageStyleFormState = {
  accent_color: string;
  text_color: string;
  font_family: string;
  content_alignment: ContentAlignment;
  border_radius: number;
  profile_opacity: number;
  profile_blur: number;
  glassmorphism: boolean;
  neon_glow: boolean;
  hide_card_border: boolean;
  card_border_effect: CardBorderEffectPreset;
  border_content_card: boolean;
  border_links: boolean;
};

function mergePreviewSettings(
  base: ProfileSettings,
  form: ContentPageStyleFormState,
): ProfileSettings {
  const border =
    form.card_border_effect === "none"
      ? { card_border_apply_all: false, card_border_targets: [] as ProfileSettings["card_border_targets"] }
      : writeContentPageBorderTargets(form.border_content_card, form.border_links);

  return {
    ...base,
    accent_color: form.accent_color,
    text_color: form.text_color,
    font_family: form.font_family,
    content_alignment: form.content_alignment,
    border_radius: form.border_radius,
    profile_opacity: form.profile_opacity,
    profile_blur: form.profile_blur,
    glassmorphism: form.glassmorphism,
    neon_glow: form.neon_glow,
    hide_card_border: form.hide_card_border,
    card_border_effect: form.card_border_effect,
    card_border_apply_all: border.card_border_apply_all,
    card_border_targets: border.card_border_targets,
  };
}

export function ContentPageStylePreview({
  page,
  settings,
  form,
}: {
  page: Pick<ProfilePage, "label" | "slug" | "icon" | "bio">;
  settings: ProfileSettings;
  form: ContentPageStyleFormState;
}) {
  const preview = useMemo(() => mergePreviewSettings(settings, form), [settings, form]);
  const fontCss = getFontCss(preview.font_family);
  const fontUrl = getFontStylesheetUrl(preview.font_family);
  const fontLabel = getFontLabel(preview.font_family);
  const { shell, backdrop } = buildCardStyles(preview);
  const alignClass = getProfileAlignClass(preview.content_alignment);
  const pageTitle = page.label || page.slug;
  const showLinkBorder = form.card_border_effect !== "none" && form.border_links;

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0a]">
      {fontUrl ? <link rel="stylesheet" href={fontUrl} /> : null}

      <div className="border-b border-white/[0.06] px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Page preview</p>
        <p className="mt-1 text-xs text-neutral-400">
          Font: <span className="font-medium text-neutral-200">{fontLabel}</span>
        </p>
      </div>

      <div
        className="relative p-5"
        style={{
          background: "linear-gradient(135deg, #1a1030 0%, #0c1929 45%, #141414 100%)",
        }}
      >
        {preview.glassmorphism || preview.profile_blur > 0 ? (
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
          <CardBorderEffect
            settings={preview}
            target="main"
            borderRadius={preview.border_radius}
            className="w-full"
          >
            <div className="relative w-full overflow-visible" style={shell as React.CSSProperties}>
              <div
                className="pointer-events-none absolute inset-0"
                style={{ ...backdrop, borderRadius: preview.border_radius } as React.CSSProperties}
                aria-hidden
              />
              <div className="relative z-[1] p-4">
              <div className="mb-4 flex items-center gap-2">
                {page.icon ? (
                  <span className="text-xl leading-none" aria-hidden>
                    {page.icon}
                  </span>
                ) : null}
                <h2 className="text-lg font-bold tracking-tight">{pageTitle}</h2>
              </div>

              {page.bio?.trim() ? (
                <ProfileBio text={page.bio} settings={preview} className="!mb-4" />
              ) : (
                <p className="mb-4 text-sm leading-relaxed opacity-70">
                  Your page text, links, embeds, and featured blocks appear here on the live page.
                </p>
              )}

              {showLinkBorder ? (
                <CardBorderEffect
                  settings={preview}
                  target="links"
                  borderRadius={preview.border_radius}
                  className="w-full"
                >
                  <div
                    className="rounded-lg border px-3 py-2.5 text-sm"
                    style={{
                      borderColor: `${preview.accent_color}35`,
                      backgroundColor: `${preview.accent_color}12`,
                    }}
                  >
                    Sample link
                  </div>
                </CardBorderEffect>
              ) : (
                <div
                  className="rounded-lg border px-3 py-2.5 text-sm"
                  style={{
                    borderColor: `${preview.accent_color}35`,
                    backgroundColor: `${preview.accent_color}12`,
                  }}
                >
                  Sample link
                </div>
              )}
              </div>
            </div>
          </CardBorderEffect>
        </div>
      </div>
    </div>
  );
}
