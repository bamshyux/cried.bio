export const CUSTOM_CURSOR_SIZE_MIN = 16;
export const CUSTOM_CURSOR_SIZE_MAX = 128;
/** Default matches the original profile cursor size before auto-shrink. */
export const CUSTOM_CURSOR_SIZE_DEFAULT = 48;

/** Default click point — center of the cursor image (previous hard-coded behavior). */
export const CURSOR_HOTSPOT_DEFAULT = 50;

export function clampCursorImageSize(value: unknown, fallback = CUSTOM_CURSOR_SIZE_DEFAULT): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(CUSTOM_CURSOR_SIZE_MAX, Math.max(CUSTOM_CURSOR_SIZE_MIN, Math.round(parsed)));
}

export function clampCursorHotspotPercent(
  value: unknown,
  fallback = CURSOR_HOTSPOT_DEFAULT,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(100, Math.max(0, Math.round(parsed * 100) / 100));
}

export function cursorHotspotTransform(hotspotX: number, hotspotY: number): string {
  const x = clampCursorHotspotPercent(hotspotX);
  const y = clampCursorHotspotPercent(hotspotY);
  return `translate(-${x}%, -${y}%)`;
}

export type CursorHotspot = {
  x: number;
  y: number;
};
