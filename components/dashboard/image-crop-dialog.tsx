"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  cardClassName,
} from "@/components/dashboard/form-fields";
import {
  clampCropOffset,
  cropImageToFile,
  getCoverScale,
  loadImageElement,
  type CropTransform,
} from "@/lib/uploads/image-crop";

export type ImageCropDialogProps = {
  imageSrc: string;
  originalFile: File;
  aspectRatio: number;
  exportWidth: number;
  exportHeight: number;
  title?: string;
  description?: string;
  cropShape?: "rect" | "circle";
  onConfirm: (file: File) => void;
  onCancel: () => void;
};

const MAX_FRAME_WIDTH = 520;

export function ImageCropDialog({
  imageSrc,
  originalFile,
  aspectRatio,
  exportWidth,
  exportHeight,
  title = "Crop image",
  description = "Drag to reposition and use the slider to zoom.",
  cropShape = "rect",
  onConfirm,
  onCancel,
}: ImageCropDialogProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState<CropTransform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [minScale, setMinScale] = useState(1);
  const [maxScale, setMaxScale] = useState(3);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string>();
  const dragState = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    let cancelled = false;

    void loadImageElement(imageSrc).then((loaded) => {
      if (!cancelled) setImage(loaded);
    });

    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const updateSize = () => {
      const width = Math.min(frame.clientWidth, MAX_FRAME_WIDTH);
      const height = width / aspectRatio;
      setFrameSize({ width, height });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [aspectRatio]);

  useEffect(() => {
    if (!image || frameSize.width <= 0 || frameSize.height <= 0) return;

    const coverScale = getCoverScale(
      frameSize.width,
      frameSize.height,
      image.naturalWidth,
      image.naturalHeight,
    );

    setMinScale(coverScale);
    setMaxScale(coverScale * 4);
    setTransform({
      scale: coverScale,
      offsetX: 0,
      offsetY: 0,
    });
  }, [image, frameSize.width, frameSize.height]);

  const applyTransform = useCallback(
    (next: CropTransform) => {
      if (!image || frameSize.width <= 0 || frameSize.height <= 0) {
        setTransform(next);
        return;
      }

      const clampedOffset = clampCropOffset(
        next.offsetX,
        next.offsetY,
        frameSize.width,
        frameSize.height,
        image.naturalWidth,
        image.naturalHeight,
        next.scale,
      );

      setTransform({
        scale: next.scale,
        offsetX: clampedOffset.offsetX,
        offsetY: clampedOffset.offsetY,
      });
    },
    [frameSize.height, frameSize.width, image],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = { active: true, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;

    const deltaX = event.clientX - dragState.current.x;
    const deltaY = event.clientY - dragState.current.y;
    dragState.current = { active: true, x: event.clientX, y: event.clientY };

    applyTransform({
      ...transform,
      offsetX: transform.offsetX + deltaX,
      offsetY: transform.offsetY + deltaY,
    });
  };

  const handlePointerUp = () => {
    dragState.current.active = false;
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = -event.deltaY * 0.0015;
    const nextScale = Math.min(maxScale, Math.max(minScale, transform.scale * (1 + delta)));
    applyTransform({ ...transform, scale: nextScale });
  };

  const handleConfirm = async () => {
    if (!image || frameSize.width <= 0 || frameSize.height <= 0) return;

    setExporting(true);
    setError(undefined);

    try {
      const cropped = await cropImageToFile(
        image,
        frameSize.width,
        frameSize.height,
        transform,
        exportWidth,
        exportHeight,
        originalFile,
      );
      onConfirm(cropped);
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : "Could not crop image.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const imageLeft =
    frameSize.width / 2 - ((image?.naturalWidth ?? 0) * transform.scale) / 2 + transform.offsetX;
  const imageTop =
    frameSize.height / 2 - ((image?.naturalHeight ?? 0) * transform.scale) / 2 + transform.offsetY;

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className={`${cardClassName} w-full max-w-xl`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-xs text-neutral-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/[0.08] px-2 py-1 text-xs text-neutral-400 hover:text-white"
          >
            Close
          </button>
        </div>

        <div
          ref={frameRef}
          className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#050505] touch-none"
          style={{ aspectRatio }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          {image ? (
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              className="absolute max-w-none select-none"
              style={{
                width: image.naturalWidth * transform.scale,
                height: image.naturalHeight * transform.scale,
                left: imageLeft,
                top: imageTop,
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">
              Loading image...
            </div>
          )}

          {cropShape === "circle" ? (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
                borderRadius: "9999px",
              }}
            />
          ) : (
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" />
          )}
        </div>

        <div className="mt-4 space-y-2">
          <label htmlFor="crop-zoom" className="block text-xs font-medium text-neutral-400">
            Zoom
          </label>
          <input
            id="crop-zoom"
            type="range"
            min={minScale}
            max={maxScale}
            step={(maxScale - minScale) / 200}
            value={transform.scale}
            onChange={(event) =>
              applyTransform({ ...transform, scale: Number(event.target.value) })
            }
            className="w-full accent-[#5865F2]"
          />
        </div>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className={buttonSecondaryClassName}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={exporting || !image}
            className={buttonPrimaryClassName}
          >
            {exporting ? "Saving..." : "Apply crop"}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
