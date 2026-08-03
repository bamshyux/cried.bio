import type { EntitlementValues } from "@/lib/premium/types";

export const FREE_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const PREMIUM_MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

/** Supabase Free plan global storage cap — bucket SQL cannot exceed this. */
export const SUPABASE_FREE_PLAN_MAX_BYTES = FREE_MAX_UPLOAD_BYTES;

/** @deprecated Use FREE_MAX_UPLOAD_BYTES */
export const MAX_BACKGROUND_UPLOAD_BYTES = FREE_MAX_UPLOAD_BYTES;

/** @deprecated Use formatUploadSizeLabel(FREE_MAX_UPLOAD_BYTES) */
export const MAX_BACKGROUND_UPLOAD_LABEL = "50 MB";

export function formatUploadSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const mb = bytes / (1024 * 1024);
  if (mb >= 0.1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  if (kb >= 1) return `${kb.toFixed(0)} KB`;
  return `${bytes} B`;
}

export function formatUploadSizeLabel(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (Number.isInteger(mb)) return `${mb} MB`;
  return `${Math.round(mb)} MB`;
}

/** Hard cap from Supabase Storage global settings (Free = 50 MB; raise after Pro upgrade). */
export function resolvePlatformMaxUploadBytes(): number {
  const raw = process.env.SUPABASE_STORAGE_GLOBAL_LIMIT_BYTES?.trim();
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return SUPABASE_FREE_PLAN_MAX_BYTES;
}

export function resolveEntitlementMaxUploadBytes(
  entitlements?: Pick<EntitlementValues, "max_upload_bytes"> | null,
): number {
  const value = entitlements?.max_upload_bytes;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  return FREE_MAX_UPLOAD_BYTES;
}

export function resolveMaxUploadBytes(
  entitlements?: Pick<EntitlementValues, "max_upload_bytes"> | null,
): number {
  return Math.min(
    resolveEntitlementMaxUploadBytes(entitlements),
    resolvePlatformMaxUploadBytes(),
  );
}

export function uploadSizeError(fileSize: number | undefined, maxBytes: number): string {
  const sizePart = fileSize ? `Your file is ${formatUploadSize(fileSize)}. ` : "";
  return `${sizePart}Maximum upload size is ${formatUploadSizeLabel(maxBytes)}.`;
}

export function backgroundUploadSizeError(
  fileSize?: number,
  maxBytes: number = FREE_MAX_UPLOAD_BYTES,
): string {
  return uploadSizeError(fileSize, maxBytes);
}
