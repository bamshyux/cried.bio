"use client";

import type { Profile } from "@/lib/types/profile";
import type { ProfileSettings } from "@/lib/types/settings";
import {
  getEnterGateAlignClasses,
  getEnterGateButtonClasses,
  getEnterGateButtonStyle,
  resolveEnterGateAccent,
  resolveEnterGateSubtitleColor,
  resolveEnterGateTitleColor,
} from "@/lib/enter-gate";
import { EnterGateBackground } from "./enter-gate-background";
import { ParticleCanvas } from "./particle-canvas";

type ProfileEnterGateProps = {
  profile: Profile;
  settings: ProfileSettings;
  onEnter: () => void;
  preview?: boolean;
};

export function ProfileEnterGate({ profile, settings, onEnter, preview = false }: ProfileEnterGateProps) {
  const displayName = profile.display_name?.trim() || profile.username || "User";
  const title = settings.enter_gate_title.trim() || displayName;
  const subtitle = settings.enter_gate_subtitle.trim();
  const buttonLabel = settings.enter_gate_button.trim() || "Click to enter";
  const accent = resolveEnterGateAccent(settings);
  const titleColor = resolveEnterGateTitleColor(settings);
  const subtitleColor = resolveEnterGateSubtitleColor(settings);
  const align = getEnterGateAlignClasses(settings.enter_gate_text_align);
  const btnAnimClass = getEnterGateButtonClasses(settings.enter_gate_animation);
  const btnStyle = getEnterGateButtonStyle(settings.enter_gate_button_style, accent);
  const cardOpacity = settings.enter_gate_card_opacity / 100;

  const showSubtitle = subtitle || (settings.enter_gate_show_username && profile.username);

  const rootClass = preview
    ? "bf-enter-gate bf-enter-gate--preview relative flex min-h-[320px] w-full items-center justify-center overflow-hidden px-6"
    : "bf-enter-gate fixed inset-0 z-[100] flex cursor-pointer items-center justify-center px-6";

  const content = (
    <>
      <EnterGateBackground settings={settings} />

      {settings.enter_gate_particle_effect && !preview ? (
        <ParticleCanvas effect={settings.enter_gate_particle_effect} />
      ) : null}

      <div
        className={`bf-enter-gate-card pointer-events-none relative z-10 flex w-full max-w-sm flex-col ${align.card} ${
          settings.enter_gate_glass_card
            ? "rounded-2xl border border-white/[0.08] px-8 py-10 backdrop-blur-xl"
            : ""
        }`}
        style={
          settings.enter_gate_glass_card
            ? {
                backgroundColor: `rgba(10, 10, 10, ${cardOpacity})`,
                boxShadow: `0 24px 64px rgba(0,0,0,${Math.min(cardOpacity + 0.2, 0.6)})`,
              }
            : undefined
        }
      >
        {settings.enter_gate_show_avatar ? (
          profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="mb-5 h-24 w-24 rounded-full object-cover ring-2 ring-white/10"
              style={{ boxShadow: `0 0 40px ${accent}30` }}
            />
          ) : (
            <div
              className="mb-5 flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-[#090909]"
              style={{ background: accent, boxShadow: `0 0 40px ${accent}30` }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )
        ) : null}

        <h1
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
          style={{ color: titleColor }}
        >
          {title}
        </h1>

        {showSubtitle ? (
          subtitle ? (
            <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: subtitleColor }}>
              {subtitle}
            </p>
          ) : (
            <p className="mt-2 text-sm" style={{ color: subtitleColor }}>
              @{profile.username}
            </p>
          )
        ) : null}

        <span
          className={`mt-8 inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-semibold text-white ${btnAnimClass}`}
          style={btnStyle}
        >
          {buttonLabel}
          {settings.enter_gate_button_style !== "minimal" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>

        {settings.enter_gate_show_branding ? (
          <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-neutral-600">cried.bio</p>
        ) : null}
      </div>
    </>
  );

  if (preview) {
    return <div className={`${rootClass} ${align.container}`}>{content}</div>;
  }

  return (
    <button
      type="button"
      className={`${rootClass} ${align.container}`}
      onClick={onEnter}
      aria-label={buttonLabel}
    >
      {content}
    </button>
  );
}
