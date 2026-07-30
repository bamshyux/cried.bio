import { resolveProfileAvatarEffect } from "@/lib/profile-avatar-effects/resolve";
import type { ProfileSettings } from "@/lib/types/settings";
import type { CSSProperties, ReactNode } from "react";

type ProfileAvatarEffectProps = {
  settings: ProfileSettings;
  sizePx: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function ProfileAvatarEffect({
  settings,
  sizePx,
  className,
  style,
  children,
}: ProfileAvatarEffectProps) {
  const resolved = resolveProfileAvatarEffect(settings, sizePx);

  if (!resolved) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const showGlow = resolved.effect !== "standard";
  const showSparks = resolved.effect === "lightning";

  return (
    <div
      className={`bf-cbe bf-pae inline-block shrink-0 ${className ?? ""}`.trim()}
      style={{
        width: sizePx,
        height: sizePx,
        ...resolved.style,
        ...style,
      }}
      data-cbe-effect={resolved.effect}
    >
      {showGlow ? <div className="bf-cbe__glow" aria-hidden="true" /> : null}
      <div className="bf-cbe__border" aria-hidden="true" />
      {showSparks ? <div className="bf-cbe__sparks" aria-hidden="true" /> : null}
      <div className="bf-cbe__inner bf-pae__inner">{children}</div>
    </div>
  );
}
