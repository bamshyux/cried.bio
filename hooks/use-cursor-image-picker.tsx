"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CursorHotspotDialog } from "@/components/dashboard/cursor-hotspot-dialog";
import { IMAGE_CROP_PRESETS } from "@/lib/uploads/image-crop";
import { useImageCropPicker } from "@/hooks/use-image-crop-picker";
import type { CursorHotspot } from "@/lib/profile/custom-cursor";

type HotspotSession = {
  file: File;
  src: string;
  initialHotspot?: CursorHotspot;
};

export type UseCursorImagePickerOptions = {
  initialHotspot?: CursorHotspot;
  onComplete: (file: File, hotspot: CursorHotspot) => void | Promise<void>;
};

export function useCursorImagePicker(options: UseCursorImagePickerOptions) {
  const [hotspotSession, setHotspotSession] = useState<HotspotSession | null>(null);
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const closeHotspot = useCallback(() => {
    setHotspotSession((current) => {
      if (current?.src.startsWith("blob:")) {
        URL.revokeObjectURL(current.src);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (hotspotSession?.src.startsWith("blob:")) {
        URL.revokeObjectURL(hotspotSession.src);
      }
    };
  }, [hotspotSession]);

  const openHotspotStep = useCallback(
    (file: File) => {
      setHotspotSession((current) => {
        if (current?.src.startsWith("blob:")) {
          URL.revokeObjectURL(current.src);
        }
        return {
          file,
          src: URL.createObjectURL(file),
          initialHotspot: options.initialHotspot,
        };
      });
    },
    [options.initialHotspot],
  );

  const crop = useImageCropPicker({
    ...IMAGE_CROP_PRESETS.cursor,
    onCropped: openHotspotStep,
  });

  const handleHotspotConfirm = useCallback(
    (hotspot: CursorHotspot) => {
      if (!hotspotSession) return;
      const file = hotspotSession.file;
      closeHotspot();
      void onCompleteRef.current(file, hotspot);
    },
    [closeHotspot, hotspotSession],
  );

  const openHotspotEditor = useCallback(
    (imageSrc: string, initialHotspot?: CursorHotspot) => {
      setHotspotSession((current) => {
        if (current?.src.startsWith("blob:")) {
          URL.revokeObjectURL(current.src);
        }
        return {
          file: new File([], "cursor-hotspot-preview"),
          src: imageSrc,
          initialHotspot,
        };
      });
    },
    [],
  );

  const dialog = (
    <>
      {crop.dialog}
      {hotspotSession ? (
        <CursorHotspotDialog
          imageSrc={hotspotSession.src}
          initialHotspot={hotspotSession.initialHotspot ?? options.initialHotspot}
          onConfirm={handleHotspotConfirm}
          onCancel={closeHotspot}
        />
      ) : null}
    </>
  );

  return {
    open: crop.open,
    openHotspotEditor,
    dialog,
    isOpen: crop.isOpen || Boolean(hotspotSession),
  };
}

export function useCursorHotspotEditor(options: {
  onConfirm: (hotspot: CursorHotspot) => void | Promise<void>;
}) {
  const [session, setSession] = useState<{ src: string; initialHotspot?: CursorHotspot } | null>(
    null,
  );
  const onConfirmRef = useRef(options.onConfirm);
  onConfirmRef.current = options.onConfirm;

  const close = useCallback(() => setSession(null), []);

  const open = useCallback((imageSrc: string, initialHotspot?: CursorHotspot) => {
    setSession({ src: imageSrc, initialHotspot });
  }, []);

  const dialog = session ? (
    <CursorHotspotDialog
      imageSrc={session.src}
      initialHotspot={session.initialHotspot}
      onConfirm={(hotspot) => {
        close();
        void onConfirmRef.current(hotspot);
      }}
      onCancel={close}
    />
  ) : null;

  return { open, close, dialog, isOpen: Boolean(session) };
}
