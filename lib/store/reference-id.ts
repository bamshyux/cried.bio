import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const PURCHASE_REFERENCE_PREFIX = "CRIED-";
export const PURCHASE_REFERENCE_PATTERN = /CRIED-[A-F0-9]{8}\b/g;

export function formatPurchaseReferenceId(raw: string): string {
  const normalized = raw.trim().toUpperCase();
  if (normalized.startsWith(PURCHASE_REFERENCE_PREFIX)) return normalized;
  return `${PURCHASE_REFERENCE_PREFIX}${normalized.replace(/^CRIED-?/, "")}`;
}

export function generatePurchaseReferenceCandidate(): string {
  return `${PURCHASE_REFERENCE_PREFIX}${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function generateUniquePurchaseReferenceId(): Promise<string> {
  const admin = createAdminClient();
  if (!admin) {
    return generatePurchaseReferenceCandidate();
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = generatePurchaseReferenceCandidate();
    const { data } = await admin
      .from("purchases")
      .select("id")
      .eq("reference_id", candidate)
      .maybeSingle();

    if (!data?.id) return candidate;
  }

  return `${PURCHASE_REFERENCE_PREFIX}${randomBytes(6).toString("hex").toUpperCase().slice(0, 8)}`;
}

export function extractPurchaseReferenceIds(text: string): string[] {
  const matches = text.match(PURCHASE_REFERENCE_PATTERN);
  if (!matches) return [];
  return [...new Set(matches.map((match) => match.toUpperCase()))];
}
