"use client";

import type { ProfileSettings } from "@/lib/types/settings";

export function ProfileBackground({ settings }: { settings: ProfileSettings }) {
  const colors = settings.gradient_colors.length >= 2
    ? settings.gradient_colors
    : ["#090909", "#141414"];

  const gradientStyle = {
    background: `linear-gradient(135deg, ${colors.join(", ")})`,
    backgroundSize: settings.animated_gradient ? "400% 400%" : undefined,
    animation: settings.animated_gradient ? "bf-gradient-shift 10s ease infinite" : undefined,
  };

  const overlayOpacity = settings.overlay_opacity / 100;

  let bg: React.ReactNode;

  if (settings.background_type === "video" && settings.background_video_url) {
    bg = (
      <video src={settings.background_video_url} autoPlay muted loop playsInline className="h-full w-full object-cover" />
    );
  } else if (settings.background_type === "image" && settings.background_image_url) {
    bg = <img src={settings.background_image_url} alt="" className="h-full w-full object-cover" />;
  } else if (settings.background_type === "animated_gradient") {
    bg = <div className="h-full w-full" style={gradientStyle} />;
  } else if (settings.background_type === "solid") {
    bg = <div className="h-full w-full" style={{ backgroundColor: settings.background_color }} />;
  } else {
    bg = (
      <div className="h-full w-full" style={{ backgroundColor: settings.background_color }}>
        <div className="h-full w-full opacity-40" style={gradientStyle} />
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-0 ${settings.noise_texture ? "bf-noise" : ""} ${settings.vignette ? "bf-vignette" : ""}`}>
      {bg}
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
    </div>
  );
}
