"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageCropDialog } from "@/components/dashboard/image-crop-dialog";
import { shouldCropImageFile } from "@/lib/uploads/image-crop";

export type UseImageCropPickerOptions = {
  aspectRatio: number;
  exportWidth: number;
  exportHeight: number;
  title?: string;
  description?: string;
  cropShape?: "rect" | "circle";
  onCropped: (file: File) => void | Promise<void>;
};

type CropSession = {
  file: File;
  src: string;
};

export function useImageCropPicker(options: UseImageCropPickerOptions) {
  const [session, setSession] = useState<CropSession | null>(null);
  const onCroppedRef = useRef(options.onCropped);
  onCroppedRef.current = options.onCropped;

  const close = useCallback(() => {
    setSession((current) => {
      if (current?.src.startsWith("blob:")) {
        URL.revokeObjectURL(current.src);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (session?.src.startsWith("blob:")) {
        URL.revokeObjectURL(session.src);
      }
    };
  }, [session]);

  const open = useCallback(
    (file: File | undefined) => {
      if (!file) return;

      if (!shouldCropImageFile(file)) {
        void onCroppedRef.current(file);
        return;
      }

      setSession((current) => {
        if (current?.src.startsWith("blob:")) {
          URL.revokeObjectURL(current.src);
        }
        return { file, src: URL.createObjectURL(file) };
      });
    },
    [],
  );

  const handleConfirm = useCallback(
    (file: File) => {
      close();
      void onCroppedRef.current(file);
    },
    [close],
  );

  const dialog =
    session ? (
      <ImageCropDialog
        imageSrc={session.src}
        originalFile={session.file}
        aspectRatio={options.aspectRatio}
        exportWidth={options.exportWidth}
        exportHeight={options.exportHeight}
        title={options.title}
        description={options.description}
        cropShape={options.cropShape}
        onConfirm={handleConfirm}
        onCancel={close}
      />
    ) : null;

  return {
    open,
    close,
    dialog,
    isOpen: Boolean(session),
  };
}
