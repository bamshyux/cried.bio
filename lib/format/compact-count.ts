/** Compact display: 913191 → 913.2K, 183000 → 183K */
export function formatCompactCount(value: number): string {
  const n = Math.max(0, Math.floor(value));
  if (n >= 1_000_000) {
    const scaled = n / 1_000_000;
    return scaled >= 100
      ? `${Math.round(scaled)}M`
      : `${scaled.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 10_000) {
    return `${Math.round(n / 1_000)}K`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return n.toLocaleString();
}

export function formatFullCount(value: number): string {
  return Math.max(0, Math.floor(value)).toLocaleString();
}
