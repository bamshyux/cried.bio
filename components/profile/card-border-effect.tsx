import { resolveCardBorderEffect } from "@/lib/card-border-effects/resolve";
import type { CardBorderTarget } from "@/lib/card-border-effects/types";
import type { ProfileSettings } from "@/lib/types/settings";
import type { CSSProperties, ReactNode } from "react";

type CardBorderEffectProps = {
  settings: ProfileSettings;
  target: CardBorderTarget;
  borderRadius?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function CardBorderEffect({
  settings,
  target,
  borderRadius,
  className,
  style,
  children,
}: CardBorderEffectProps) {
  const resolved = resolveCardBorderEffect(settings, target, borderRadius);

  if (!resolved) {
    return <>{children}</>;
  }

  const showGlow = resolved.effect !== "standard";
  const showSparks = resolved.effect === "lightning";

  return (
    <div
      className={`bf-cbe ${className ?? ""}`.trim() || undefined}
      style={{ ...resolved.style, ...style }}
      data-cbe-effect={resolved.effect}
    >
      {showGlow ? <div className="bf-cbe__glow" aria-hidden="true" /> : null}
      <div className="bf-cbe__border" aria-hidden="true" />
      {showSparks ? <div className="bf-cbe__sparks" aria-hidden="true" /> : null}
      <div className="bf-cbe__inner">{children}</div>
    </div>
  );
}
