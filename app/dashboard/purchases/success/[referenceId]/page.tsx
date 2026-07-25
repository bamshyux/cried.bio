import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { PurchaseReceiptCard, PurchaseSuccessHero } from "@/components/billing/purchase-ui";
import { getPurchaseByReferenceId } from "@/lib/data/purchases";
import { createClient } from "@/lib/supabase/server";

async function PurchaseSuccessContent({ referenceId }: { referenceId: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  const purchase = await getPurchaseByReferenceId(referenceId, userId);
  if (!purchase) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PurchaseSuccessHero purchase={purchase} />
      <PurchaseReceiptCard purchase={purchase} />
    </div>
  );
}

export default async function PurchaseSuccessPage({
  params,
}: {
  params: Promise<{ referenceId: string }>;
}) {
  const { referenceId } = await params;

  return (
    <Suspense fallback={<div className="text-neutral-500">Loading receipt…</div>}>
      <PurchaseSuccessContent referenceId={decodeURIComponent(referenceId)} />
    </Suspense>
  );
}
