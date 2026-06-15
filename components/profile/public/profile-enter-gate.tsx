"use client";

import type { Profile } from "@/lib/types/profile";
import type { ProfileSettings } from "@/lib/types/settings";

type ProfileEnterGateProps = {
  profile: Profile;
  settings: ProfileSettings;
  onEnter: () => void;
};

export function ProfileEnterGate({ profile, settings, onEnter }: ProfileEnterGateProps) {
  const displayName = profile.display_name?.trim() || profile.username;
  const title = settings.enter_gate_title.trim() || displayName;
  const subtitle = settings.enter_gate_subtitle.trim();
  const buttonLabel = settings.enter_gate_button.trim() || "Click to enter";
  const accent = settings.accent_color;

  return (
    <button
      type="button"
      className="bf-enter-gate fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-black/55 px-6 backdrop-blur-sm"
      onClick={onEnter}
      aria-label={buttonLabel}
    >
      <div className="bf-enter-gate-card pointer-events-none flex max-w-sm flex-col items-center text-center">
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

        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>

        {subtitle ? (
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-neutral-400">{subtitle}</p>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">@{profile.username}</p>
        )}

        <span
          className="bf-enter-gate-btn mt-8 inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-semibold text-white"
          style={{
            borderColor: `${accent}55`,
            backgroundColor: `${accent}18`,
            boxShadow: `0 0 32px ${accent}22`,
          }}
        >
          {buttonLabel}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-neutral-600">cried.bio</p>
      </div>
    </button>
  );
}
