"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { lookupPurchaseByReferenceAction } from "@/app/actions/purchases";
import { PurchaseReceiptCard } from "@/components/billing/purchase-ui";
import { cardClassName } from "@/components/dashboard/form-fields";
import { PURCHASE_REFERENCE_PATTERN } from "@/lib/purchases/reference";
import type { Purchase } from "@/lib/types/store";

function ReferenceLink({
  referenceId,
  isStaff,
  isOwner,
}: {
  referenceId: string;
  isStaff: boolean;
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!isStaff) {
    return <span className="font-mono text-violet-200">{referenceId}</span>;
  }

  const openLookup = () => {
    startTransition(async () => {
      setError(null);
      const result = await lookupPurchaseByReferenceAction(referenceId);
      if (result.error || !result.purchase) {
        setError(result.error ?? "Purchase not found.");
        setPurchase(null);
      } else {
        setPurchase(result.purchase);
      }
      setOpen(true);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={openLookup}
        className="font-mono text-violet-200 underline decoration-violet-400/40 underline-offset-2 hover:text-violet-100"
      >
        {referenceId}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
          <div className={`${cardClassName} max-h-[90vh] w-full max-w-2xl overflow-y-auto p-0`}>
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div>
                <p className="text-sm font-medium text-white">Transaction lookup</p>
                <p className="font-mono text-xs text-neutral-500">{referenceId}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-neutral-500 hover:text-neutral-300"
              >
                Close
              </button>
            </div>
            <div className="p-5">
              {pending ? <p className="text-sm text-neutral-400">Loading purchase…</p> : null}
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              {purchase ? <PurchaseReceiptCard purchase={purchase} showActions={false} /> : null}
              {isOwner ? (
                <Link
                  href={`/dashboard/admin/transactions?ref=${encodeURIComponent(referenceId)}`}
                  className="mt-4 inline-block text-sm text-violet-300 underline"
                >
                  Open in Transactions dashboard
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function SupportMessageBody({
  body,
  isStaff,
  isOwner = false,
}: {
  body: string;
  isStaff: boolean;
  isOwner?: boolean;
}) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let partIndex = 0;

  for (const match of body.matchAll(PURCHASE_REFERENCE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(<span key={`text-${partIndex}`}>{body.slice(lastIndex, index)}</span>);
      partIndex += 1;
    }
    nodes.push(
      <ReferenceLink
        key={`ref-${partIndex}`}
        referenceId={match[0].toUpperCase()}
        isStaff={isStaff}
        isOwner={isOwner}
      />,
    );
    partIndex += 1;
    lastIndex = index + match[0].length;
  }

  if (lastIndex < body.length) {
    nodes.push(<span key={`text-${partIndex}`}>{body.slice(lastIndex)}</span>);
  }

  if (nodes.length === 0) {
    return <p className="bf-support-bubble__text">{body}</p>;
  }

  return <p className="bf-support-bubble__text">{nodes}</p>;
}
