export const PURCHASE_REFERENCE_PREFIX = "CRIED-";
export const PURCHASE_REFERENCE_PATTERN = /CRIED-[A-F0-9]{8}\b/g;

export function formatPurchaseReferenceId(raw: string): string {
  const normalized = raw.trim().toUpperCase();
  if (normalized.startsWith(PURCHASE_REFERENCE_PREFIX)) return normalized;
  return `${PURCHASE_REFERENCE_PREFIX}${normalized.replace(/^CRIED-?/, "")}`;
}

export function extractPurchaseReferenceIds(text: string): string[] {
  const matches = text.match(PURCHASE_REFERENCE_PATTERN);
  if (!matches) return [];
  return [...new Set(matches.map((match) => match.toUpperCase()))];
}
