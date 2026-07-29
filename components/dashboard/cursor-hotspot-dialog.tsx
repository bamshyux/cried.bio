"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  cardClassName,
} from "@/components/dashboard/form-fields";
import {
  clampCursorHotspotPercent,
  CURSOR_HOTSPOT_DEFAULT,
  type CursorHotspot,
} from "@/lib/profile/custom-cursor";

export type CursorHotspotDialogProps = {
  imageSrc: string;
  initialHotspot?: CursorHotspot;
  onConfirm: (hotspot: CursorHotspot) => void;
  onCancel: () => void;
};

function getContainedImageMetrics(
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
) {
  if (containerWidth <= 0 || containerHeight <= 0 || naturalWidth <= 0 || naturalHeight <= 0) {
    return { renderedWidth: 0, renderedHeight: 0, offsetX: 0, offsetY: 0 };
  }

  const imageAspect = naturalWidth / naturalHeight;
  const containerAspect = containerWidth / containerHeight;

  if (imageAspect > containerAspect) {
    const renderedWidth = containerWidth;
    const renderedHeight = containerWidth / imageAspect;
    return {
      renderedWidth,
      renderedHeight,
      offsetX: 0,
      offsetY: (containerHeight - renderedHeight) / 2,
    };
  }

  const renderedHeight = containerHeight;
  const renderedWidth = containerHeight * imageAspect;
  return {
    renderedWidth,
    renderedHeight,
    offsetX: (containerWidth - renderedWidth) / 2,
    offsetY: 0,
  };
}

function hotspotFromPointer(
  clientX: number,
  clientY: number,
  container: HTMLElement,
  naturalWidth: number,
  naturalHeight: number,
): CursorHotspot {
  const rect = container.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const metrics = getContainedImageMetrics(rect.width, rect.height, naturalWidth, naturalHeight);

  if (metrics.renderedWidth <= 0 || metrics.renderedHeight <= 0) {
    return { x: CURSOR_HOTSPOT_DEFAULT, y: CURSOR_HOTSPOT_DEFAULT };
  }

  const x = ((localX - metrics.offsetX) / metrics.renderedWidth) * 100;
  const y = ((localY - metrics.offsetY) / metrics.renderedHeight) * 100;

  return {
    x: clampCursorHotspotPercent(x),
    y: clampCursorHotspotPercent(y),
  };
}

export function CursorHotspotDialog({
  imageSrc,
  initialHotspot = { x: CURSOR_HOTSPOT_DEFAULT, y: CURSOR_HOTSPOT_DEFAULT },
  onConfirm,
  onCancel,
}: CursorHotspotDialogProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [hotspot, setHotspot] = useState<CursorHotspot>({
    x: clampCursorHotspotPercent(initialHotspot.x),
    y: clampCursorHotspotPercent(initialHotspot.y),
  });
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const updateSize = () => {
      setFrameSize({ width: frame.clientWidth, height: frame.clientHeight });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      const frame = frameRef.current;
      if (!frame || imageSize.width <= 0 || imageSize.height <= 0) return;
      setHotspot(hotspotFromPointer(clientX, clientY, frame, imageSize.width, imageSize.height));
    },
    [imageSize.height, imageSize.width],
  );

  const metrics = getContainedImageMetrics(
    frameSize.width,
    frameSize.height,
    imageSize.width,
    imageSize.height,
  );

  const markerLeft =
    metrics.renderedWidth > 0
      ? metrics.offsetX + (hotspot.x / 100) * metrics.renderedWidth
      : 0;
  const markerTop =
    metrics.renderedHeight > 0
      ? metrics.offsetY + (hotspot.y / 100) * metrics.renderedHeight
      : 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cursor-hotspot-title"
        className={`${cardClassName} flex w-full max-w-lg flex-col overflow-hidden border border-white/[0.08] shadow-2xl sm:rounded-3xl rounded-t-3xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center pt-3 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-white/15" aria-hidden />
        </div>

        <div className="border-b border-white/[0.06] px-5 py-4">
          <p id="cursor-hotspot-title" className="text-lg font-semibold text-white">
            Set click point
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            Click where visitors should click — the tip of a pointer, the center of a crosshair, and so on.
          </p>
        </div>

        <div className="px-5 py-4">
          <div
            ref={frameRef}
            className="relative mx-auto aspect-square w-full max-w-[320px] cursor-crosshair overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a]"
            onClick={(event) => handlePointer(event.clientX, event.clientY)}
            onPointerMove={(event) => {
              if (event.buttons !== 1) return;
              handlePointer(event.clientX, event.clientY);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              className="h-full w-full select-none object-contain"
              onLoad={(event) => {
                const img = event.currentTarget;
                setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
              }}
            />

            {metrics.renderedWidth > 0 ? (
              <>
                <span
                  className="pointer-events-none absolute h-px bg-sky-400/70"
                  style={{
                    left: metrics.offsetX,
                    top: markerTop,
                    width: metrics.renderedWidth,
                  }}
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute w-px bg-sky-400/70"
                  style={{
                    left: markerLeft,
                    top: metrics.offsetY,
                    height: metrics.renderedHeight,
                  }}
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-300 bg-sky-400/30 shadow-[0_0_0_2px_rgba(0,0,0,0.45)]"
                  style={{ left: markerLeft, top: markerTop }}
                  aria-hidden
                />
              </>
            ) : null}
          </div>

          <p className="mt-3 text-center text-xs text-neutral-500">
            Click point: {hotspot.x}% from left, {hotspot.y}% from top
          </p>
        </div>

        <div className="flex gap-3 border-t border-white/[0.06] px-5 py-4">
          <button type="button" onClick={onCancel} className={`${buttonSecondaryClassName} flex-1`}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(hotspot)}
            className={`${buttonPrimaryClassName} flex-1`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
