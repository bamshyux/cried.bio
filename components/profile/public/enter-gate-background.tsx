"use client";

import type { ReactNode } from "react";
import type { ProfileSettings } from "@/lib/types/settings";
import { buildEnterGateGradientStyle } from "@/lib/enter-gate";
import { ProfileBackground } from "./profile-background";

export function EnterGateBackground({ settings }: { settings: ProfileSettings }) {
  const overlayOpacity = settings.enter_gate_overlay_opacity / 100;
  const blurPx = settings.enter_gate_blur ? settings.enter_gate_blur_strength : 0;
  const blurFilter = blurPx > 0 ? `blur(${blurPx}px)` : undefined;
  const scale = blurPx > 0 ? 1.08 : 1;

  let bg: ReactNode;

  if (settings.enter_gate_background_type === "profile") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ transform: `scale(${scale})`, filter: blurFilter }}
        >
          <ProfileBackground settings={settings} contained />
        </div>
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
        />
        {settings.enter_gate_vignette ? <div className="bf-vignette absolute inset-0" /> : null}
        {settings.enter_gate_noise ? <div className="bf-noise absolute inset-0" /> : null}
      </div>
    );
  }

  if (settings.enter_gate_background_type === "video" && settings.enter_gate_background_video_url) {
    bg = (
      <video
        src={settings.enter_gate_background_video_url}
        autoPlay
        muted
        loop
        playsInline
        className="h-full w-full object-cover"
        style={{ filter: blurFilter, transform: `scale(${scale})` }}
      />
    );
  } else if (settings.enter_gate_background_type === "image" && settings.enter_gate_background_image_url) {
    bg = (
      <img
        src={settings.enter_gate_background_image_url}
        alt=""
        className="h-full w-full object-cover"
        style={{ filter: blurFilter, transform: `scale(${scale})` }}
      />
    );
  } else if (settings.enter_gate_background_type === "gradient") {
    bg = <div className="h-full w-full" style={buildEnterGateGradientStyle(settings)} />;
  } else {
    bg = (
      <div
        className="h-full w-full"
        style={{ backgroundColor: settings.enter_gate_background_color }}
      />
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ transform: blurPx > 0 ? `scale(${scale})` : undefined }}>
        {bg}
      </div>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
      />
      {settings.enter_gate_vignette ? <div className="bf-vignette absolute inset-0" /> : null}
      {settings.enter_gate_noise ? <div className="bf-noise absolute inset-0" /> : null}
    </div>
  );
}
