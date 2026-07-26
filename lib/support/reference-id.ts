/** Human-readable support ticket reference (CSR-XXXXXXXX). */
export function formatSupportReferenceId(conversationId: string): string {
  const hex = conversationId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `CSR-${hex}`;
}
