import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PURCHASE_REFERENCE_PREFIX,
} from "@/lib/purchases/reference";

export {
  extractPurchaseReferenceIds,
  formatPurchaseReferenceId,
  PURCHASE_REFERENCE_PATTERN,
  PURCHASE_REFERENCE_PREFIX,
} from "@/lib/purchases/reference";

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
