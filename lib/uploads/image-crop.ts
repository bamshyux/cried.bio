export type CropTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type CropRect = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

export function shouldCropImageFile(file: File): boolean {
  return file.type !== "image/gif";
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image."));
    image.src = src;
  });
}

export function getCoverScale(
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number,
): number {
  return Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
}

export function clampCropOffset(
  offsetX: number,
  offsetY: number,
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number,
  scale: number,
): { offsetX: number; offsetY: number } {
  const displayWidth = imageWidth * scale;
  const displayHeight = imageHeight * scale;

  const minOffsetX = frameWidth / 2 - displayWidth / 2;
  const maxOffsetX = displayWidth / 2 - frameWidth / 2;
  const minOffsetY = frameHeight / 2 - displayHeight / 2;
  const maxOffsetY = displayHeight / 2 - frameHeight / 2;

  return {
    offsetX: Math.min(maxOffsetX, Math.max(minOffsetX, offsetX)),
    offsetY: Math.min(maxOffsetY, Math.max(minOffsetY, offsetY)),
  };
}

export function getCropRect(
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number,
  transform: CropTransform,
): CropRect {
  const left = frameWidth / 2 - (imageWidth * transform.scale) / 2 + transform.offsetX;
  const top = frameHeight / 2 - (imageHeight * transform.scale) / 2 + transform.offsetY;

  const sx = Math.max(0, (0 - left) / transform.scale);
  const sy = Math.max(0, (0 - top) / transform.scale);
  const sw = Math.min(imageWidth, (frameWidth - left) / transform.scale) - sx;
  const sh = Math.min(imageHeight, (frameHeight - top) / transform.scale) - sy;

  return { sx, sy, sw, sh };
}

function resolveExportMimeType(sourceType: string): string {
  if (sourceType === "image/png") return "image/png";
  if (sourceType === "image/webp") return "image/webp";
  return "image/jpeg";
}

export function croppedFileName(original: File, mimeType: string): string {
  const base = original.name.replace(/\.[^.]+$/, "") || "image";
  const ext =
    mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return `${base}-cropped.${ext}`;
}

export async function cropImageToFile(
  image: HTMLImageElement,
  frameWidth: number,
  frameHeight: number,
  transform: CropTransform,
  exportWidth: number,
  exportHeight: number,
  originalFile: File,
): Promise<File> {
  const crop = getCropRect(
    frameWidth,
    frameHeight,
    image.naturalWidth,
    image.naturalHeight,
    transform,
  );

  if (crop.sw <= 0 || crop.sh <= 0) {
    throw new Error("Crop area is invalid.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = exportWidth;
  canvas.height = exportHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare image export.");
  }

  context.drawImage(
    image,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    exportWidth,
    exportHeight,
  );

  const mimeType = resolveExportMimeType(originalFile.type);
  const quality = mimeType === "image/jpeg" ? 0.92 : undefined;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Could not export cropped image."));
          return;
        }
        resolve(result);
      },
      mimeType,
      quality,
    );
  });

  return new File([blob], croppedFileName(originalFile, mimeType), {
    type: mimeType,
    lastModified: Date.now(),
  });
}

export function assignFileToInput(input: HTMLInputElement | null, file: File) {
  if (!input) return;
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
}

/** Common crop presets for dashboard uploads. */
export const IMAGE_CROP_PRESETS = {
  avatar: {
    aspectRatio: 1,
    exportWidth: 512,
    exportHeight: 512,
    cropShape: "circle" as const,
    title: "Crop avatar",
    description: "Drag to reposition and use the slider to zoom.",
  },
  banner: {
    aspectRatio: 3,
    exportWidth: 1500,
    exportHeight: 500,
    cropShape: "rect" as const,
    title: "Crop banner",
    description: "Drag to reposition and use the slider to zoom.",
  },
  background: {
    aspectRatio: 16 / 9,
    exportWidth: 1920,
    exportHeight: 1080,
    cropShape: "rect" as const,
    title: "Crop background",
    description: "Drag to reposition and use the slider to zoom.",
  },
  favicon: {
    aspectRatio: 1,
    exportWidth: 64,
    exportHeight: 64,
    cropShape: "rect" as const,
    title: "Crop favicon",
    description: "Drag to reposition and use the slider to zoom.",
  },
  cursor: {
    aspectRatio: 1,
    exportWidth: 128,
    exportHeight: 128,
    cropShape: "rect" as const,
    title: "Crop cursor image",
    description: "Drag to reposition and use the slider to zoom.",
  },
  linkIcon: {
    aspectRatio: 1,
    exportWidth: 256,
    exportHeight: 256,
    cropShape: "rect" as const,
    title: "Crop link icon",
    description: "Drag to reposition and use the slider to zoom.",
  },
  featured: {
    aspectRatio: 16 / 9,
    exportWidth: 1200,
    exportHeight: 675,
    cropShape: "rect" as const,
    title: "Crop featured image",
    description: "Drag to reposition and use the slider to zoom.",
  },
};
