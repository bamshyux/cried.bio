"use server";

import { requireAdminAccess } from "@/lib/auth/admin-access";
import { getPurchaseByReferenceId } from "@/lib/data/purchases";
import { formatPurchaseReferenceId } from "@/lib/purchases/reference";
import type { Purchase } from "@/lib/types/store";

export async function lookupPurchaseByReferenceAction(
  referenceId: string,
): Promise<{ error?: string; purchase?: Purchase }> {
  try {
    const access = await requireAdminAccess("admin");
    if ("error" in access) return { error: access.error };
  } catch {
    return { error: "Unauthorized." };
  }

  const purchase = await getPurchaseByReferenceId(formatPurchaseReferenceId(referenceId));
  if (!purchase) return { error: "Purchase not found." };
  return { purchase };
}
