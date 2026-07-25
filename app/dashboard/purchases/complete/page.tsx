import { Suspense } from "react";
import { PurchaseCompleteRedirect } from "@/components/billing/purchase-complete-redirect";

export default function PurchaseCompletePage() {
  return (
    <Suspense fallback={<div className="text-neutral-500">Loading…</div>}>
      <PurchaseCompleteRedirect />
    </Suspense>
  );
}
