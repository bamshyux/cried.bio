import type { CSSProperties } from "react";

export const rangeClassName = "bf-range w-full";

export function rangeFillStyle(
  value: number,
  min: number,
  max: number,
  accent?: string,
): CSSProperties {
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return {
    "--bf-range-fill": `${percent}%`,
    ...(accent ? { "--bf-range-accent": accent } : {}),
  } as CSSProperties;
}
