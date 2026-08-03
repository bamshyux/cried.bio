import {
  backgroundUploadSizeError,
  formatUploadSize,
  formatUploadSizeLabel,
  resolvePlatformMaxUploadBytes,
  uploadSizeError,
} from "@/lib/uploads/limits";

export function isStorageSizeError(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes("size") ||
    msg.includes("large") ||
    msg.includes("payload") ||
    msg.includes("maximum") ||
    msg.includes("too big") ||
    msg.includes("entity too large") ||
    (msg.includes("limit") && !msg.includes("rate"))
  );
}

/** User-facing message when Supabase rejects an upload for size/limit reasons. */
export function mapStorageUploadError(fileSize: number, maxUploadBytes: number): string {
  if (fileSize > maxUploadBytes) {
    return backgroundUploadSizeError(fileSize, maxUploadBytes);
  }

  const platformMax = resolvePlatformMaxUploadBytes();
  if (fileSize > platformMax) {
    return (
      `Your file is ${formatUploadSize(fileSize)}. Uploads over ${formatUploadSizeLabel(platformMax)} ` +
      `aren't enabled on storage yet. Try a smaller file.`
    );
  }

  return `Your file is ${formatUploadSize(fileSize)}, which is within your ${formatUploadSizeLabel(maxUploadBytes)} limit, but storage rejected the upload. Please try again.`;
}

export function mapMusicStorageUploadError(fileSize: number, maxUploadBytes: number): string {
  if (fileSize > maxUploadBytes) {
    return uploadSizeError(fileSize, maxUploadBytes);
  }

  return mapStorageUploadError(fileSize, maxUploadBytes);
}
