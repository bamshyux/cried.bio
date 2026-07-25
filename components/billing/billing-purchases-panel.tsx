"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PurchaseReceiptCard,
  PurchaseStatusPill,
} from "@/components/billing/purchase-ui";
import { cardClassName } from "@/components/dashboard/form-fields";
import {
  formatPurchaseAmount,
  formatPurchaseStatus,
} from "@/lib/purchases/display";
import type { Purchase } from "@/lib/types/store";

export function BillingPurchasesPanel({ purchases }: { purchases: Purchase[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => purchases.find((purchase) => purchase.id === selectedId) ?? null,
    [purchases, selectedId],
  );

  if (purchases.length === 0) {
    return (
      <div className={`${cardClassName} text-center`}>
        <p className="text-sm text-neutral-400">No purchases yet.</p>
        <Link href="/dashboard/store" className="mt-3 inline-block text-sm text-violet-300 underline">
          Browse the Store
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${cardClassName} overflow-hidden p-0`}>
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Purchase history</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Manage receipts, reference IDs, and payment details for everything you&apos;ve bought.
          </p>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-white">{purchase.product_name}</p>
                  <PurchaseStatusPill status={purchase.status} />
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {new Date(purchase.created_at).toLocaleString()} · {purchase.reference_id}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold text-white">
                  {formatPurchaseAmount(purchase.amount_paid, purchase.currency)}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedId(purchase.id)}
                  className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-white/[0.18] hover:text-white"
                >
                  View details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-neutral-300">Receipt details</h3>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-xs text-neutral-500 hover:text-neutral-300"
            >
              Close
            </button>
          </div>
          <PurchaseReceiptCard purchase={selected} />
        </div>
      ) : null}
    </div>
  );
}

export function BillingPurchasesPanelWithTabSupport({
  purchases,
}: {
  purchases: Purchase[];
}) {
  const searchParams = useSearchParams();
  const highlightRef = searchParams.get("ref");

  useEffect(() => {
    if (!highlightRef) return;
    const match = purchases.find((purchase) => purchase.reference_id === highlightRef.toUpperCase());
    if (match) {
      const el = document.getElementById(`purchase-${match.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightRef, purchases]);

  return <BillingPurchasesPanel purchases={purchases} />;
}

export function PurchaseListSummary({ purchase }: { purchase: Purchase }) {
  return (
    <div className="text-sm text-neutral-400">
      {formatPurchaseStatus(purchase.status)} · {formatPurchaseAmount(purchase.amount_paid, purchase.currency)}
    </div>
  );
}
