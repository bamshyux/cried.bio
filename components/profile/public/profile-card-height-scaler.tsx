"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { CARD_LAYOUT_MIN_HEIGHT } from "@/lib/settings";

type ScaleMetrics = {
  scale: number;
  boxHeight: number | undefined;
  naturalHeight: number;
};

function computeScaleMetrics(naturalHeight: number, maxHeight: number): ScaleMetrics {
  const natural = Math.max(naturalHeight, CARD_LAYOUT_MIN_HEIGHT);

  if (maxHeight <= 0) {
    return { scale: 1, boxHeight: undefined, naturalHeight: natural };
  }

  const target = Math.max(CARD_LAYOUT_MIN_HEIGHT, maxHeight);
  const scale = Math.min(1, target / natural);

  return {
    scale,
    boxHeight: target,
    naturalHeight: natural,
  };
}

function measureNaturalContentHeight(content: HTMLElement) {
  const scaler = content.parentElement;

  const saved = {
    transform: content.style.transform,
    transformOrigin: content.style.transformOrigin,
    width: content.style.width,
    marginInline: content.style.marginInline,
    scalerHeight: scaler?.style.height ?? "",
    scalerOverflow: scaler?.style.overflow ?? "",
  };

  // Measure at full natural size — parent height/overflow would otherwise under-report scrollHeight.
  if (scaler) {
    scaler.style.height = "auto";
    scaler.style.overflow = "visible";
  }

  content.style.transform = "none";
  content.style.transformOrigin = "top left";
  content.style.width = "100%";
  content.style.marginInline = "";

  const natural = Math.max(content.scrollHeight, CARD_LAYOUT_MIN_HEIGHT);

  content.style.transform = saved.transform;
  content.style.transformOrigin = saved.transformOrigin;
  content.style.width = saved.width;
  content.style.marginInline = saved.marginInline;

  if (scaler) {
    scaler.style.height = saved.scalerHeight;
    scaler.style.overflow = saved.scalerOverflow;
  }

  return natural;
}

export function ProfileCardHeightScaler({
  maxHeight,
  parallaxEnabled = false,
  children,
}: {
  maxHeight: number;
  parallaxEnabled?: boolean;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<ScaleMetrics>(() =>
    computeScaleMetrics(CARD_LAYOUT_MIN_HEIGHT, maxHeight),
  );

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      const natural = measureNaturalContentHeight(el);
      setMetrics(computeScaleMetrics(natural, maxHeight));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => observer.disconnect();
  }, [maxHeight, children]);

  const constrained = maxHeight > 0 && metrics.boxHeight !== undefined && metrics.scale < 1;
  const clipOverflow = constrained && !parallaxEnabled;

  return (
    <div
      className="profile-card-height-scaler overflow-visible"
      style={
        constrained
          ? {
              height: metrics.boxHeight,
              overflow: clipOverflow ? "hidden" : "visible",
              position: "relative",
            }
          : undefined
      }
    >
      <div
        ref={contentRef}
        className="profile-card-height-scaler__content"
        style={
          constrained
            ? {
                transform: `scale(${metrics.scale})`,
                transformOrigin: "top left",
                width: `${100 / metrics.scale}%`,
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}

export function measureProfileCardNaturalHeight(container: HTMLDivElement | null) {
  if (!container) return CARD_LAYOUT_MIN_HEIGHT;

  const content = container.querySelector<HTMLElement>(".profile-card-height-scaler__content");
  if (!content) return CARD_LAYOUT_MIN_HEIGHT;

  return measureNaturalContentHeight(content);
}
