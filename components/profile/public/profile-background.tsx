"use client";

import { resolveProfileBackgroundMedia } from "@/lib/uploads/background-media";
import type { ProfileSettings } from "@/lib/types/settings";

export function ProfileBackground({
  settings,
  contained = false,
}: {
  settings: ProfileSettings;
  contained?: boolean;
}) {
  const colors = settings.gradient_colors.length >= 2
    ? settings.gradient_colors
    : ["#090909", "#141414"];

  const gradientStyle = {
    background: `linear-gradient(135deg, ${colors.join(", ")})`,
    backgroundSize: settings.animated_gradient ? "400% 400%" : undefined,
    animation: settings.animated_gradient ? "bf-gradient-shift 10s ease infinite" : undefined,
  };

  const overlayOpacity = settings.overlay_opacity / 100;
  const backgroundMedia = resolveProfileBackgroundMedia(settings);

  let bg: React.ReactNode;

  if (backgroundMedia.kind === "video" && backgroundMedia.url) {
    bg = (
      <video
        src={backgroundMedia.url}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
      />
    );
  } else if (backgroundMedia.kind === "image" && backgroundMedia.url) {
    bg = <img src={backgroundMedia.url} alt="" className="h-full w-full object-cover" />;
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
    <div
      className={`${contained ? "absolute inset-0 h-full w-full" : "fixed inset-0 z-0"} ${settings.noise_texture ? "bf-noise" : ""} ${settings.vignette ? "bf-vignette" : ""}`}
    >
      {bg}
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
    </div>
  );
}
