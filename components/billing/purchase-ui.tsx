"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { DownloadReceiptButton } from "@/components/billing/download-receipt-button";
import { buttonPrimaryClassName, cardClassName } from "@/components/dashboard/form-fields";
import {
  formatPurchaseAmount,
  formatPurchaseStatus,
} from "@/lib/purchases/display";
import type { Purchase } from "@/lib/types/store";

export function CopyValueButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      data-receipt-exclude="true"
      className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-white/[0.18] hover:text-white"
    >
      {copied ? "Copied" : label ?? "Copy"}
    </button>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
  copyValue,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  copyValue?: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/[0.06] px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-neutral-500">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-sm text-white ${mono ? "font-mono text-[13px]" : ""}`}>{value}</span>
        {copyValue ? <CopyValueButton value={copyValue} /> : null}
      </div>
    </div>
  );
}

export function PurchaseStatusPill({ status }: { status: string }) {
  const label = formatPurchaseStatus(status);
  const tone =
    status === "completed"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : status === "refunded"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
        : "border-white/[0.1] bg-white/[0.04] text-neutral-300";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

export function PurchaseReceiptCard({
  purchase,
  showAdvanced = true,
  showActions = true,
}: {
  purchase: Purchase;
  showAdvanced?: boolean;
  showActions?: boolean;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const receiptFilename = `cried-receipt-${purchase.reference_id}.png`;

  return (
    <div className={`${cardClassName} overflow-hidden p-0`}>
      <div ref={receiptRef}>
        <div className="border-b border-white/[0.06] px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Receipt</p>
              <h2 className="mt-1 text-xl font-semibold text-white">{purchase.product_name}</h2>
            </div>
            <PurchaseStatusPill status={purchase.status} />
          </div>
        </div>

        <ReceiptRow label="Product" value={purchase.product_name} />
        <ReceiptRow
          label="Amount"
          value={formatPurchaseAmount(purchase.amount_paid, purchase.currency)}
        />
        <ReceiptRow
          label="Date"
          value={new Date(purchase.created_at).toLocaleString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        />
        <ReceiptRow label="Status" value={formatPurchaseStatus(purchase.status)} />
        <ReceiptRow
          label="Reference ID"
          value={purchase.reference_id}
          mono
          copyValue={purchase.reference_id}
        />
        {purchase.payment_method ? (
          <ReceiptRow label="Payment method" value={purchase.payment_method} />
        ) : null}
        {purchase.receipt_number ? (
          <ReceiptRow label="Receipt number" value={purchase.receipt_number} mono />
        ) : null}
        {purchase.invoice_number ? (
          <ReceiptRow label="Invoice number" value={purchase.invoice_number} mono />
        ) : null}
        <ReceiptRow label="Currency" value={purchase.currency.toUpperCase()} />

        {showAdvanced ? (
          <div className="border-t border-white/[0.06] bg-white/[0.02]">
            <div className="px-5 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                Advanced details
              </p>
            </div>
            {purchase.stripe_payment_intent ? (
              <ReceiptRow
                label="Stripe Payment ID"
                value={purchase.stripe_payment_intent}
                mono
                copyValue={purchase.stripe_payment_intent}
              />
            ) : null}
            <ReceiptRow
              label="Stripe Checkout Session"
              value={purchase.stripe_checkout_session_id}
              mono
              copyValue={purchase.stripe_checkout_session_id}
            />
            {purchase.stripe_customer_id ? (
              <ReceiptRow
                label="Stripe Customer ID"
                value={purchase.stripe_customer_id}
                mono
                copyValue={purchase.stripe_customer_id}
              />
            ) : null}
          </div>
        ) : null}

        <div className="border-t border-white/[0.06] px-5 py-3 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">cried.bio</p>
        </div>
      </div>

      {showActions ? (
        <div className="flex flex-wrap gap-3 border-t border-white/[0.06] px-5 py-4">
          <CopyValueButton value={purchase.reference_id} label="Copy Reference ID" />
          {purchase.stripe_payment_intent ? (
            <CopyValueButton value={purchase.stripe_payment_intent} label="Copy Payment ID" />
          ) : null}
          <DownloadReceiptButton targetRef={receiptRef} filename={receiptFilename} />
        </div>
      ) : null}
    </div>
  );
}

export function PurchaseSuccessHero({ purchase }: { purchase: Purchase }) {
  return (
    <div className={`${cardClassName} overflow-hidden`}>
      <div className="border-b border-emerald-500/20 bg-emerald-500/10 px-6 py-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 text-2xl text-emerald-200">
          ✓
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Purchase successful</h1>
        <p className="mt-2 text-sm text-emerald-100/80">
          Your payment was processed. Save your reference ID for support.
        </p>
      </div>

      <div className="grid gap-0 divide-y divide-white/[0.06]">
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Product</p>
            <p className="mt-1 text-sm font-medium text-white">{purchase.product_name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Amount paid</p>
            <p className="mt-1 text-sm font-medium text-white">
              {formatPurchaseAmount(purchase.amount_paid, purchase.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Purchase date</p>
            <p className="mt-1 text-sm text-neutral-200">
              {new Date(purchase.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Payment status</p>
            <div className="mt-1">
              <PurchaseStatusPill status={purchase.status} />
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Reference ID</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-lg font-semibold tracking-wide text-white">
              {purchase.reference_id}
            </span>
            <CopyValueButton value={purchase.reference_id} />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Share this ID with cried.bio support if you need help with your purchase.
          </p>
        </div>

        {purchase.payment_method ? (
          <div className="px-6 py-5">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Payment method</p>
            <p className="mt-1 text-sm text-neutral-200">{purchase.payment_method}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-white/[0.06] px-6 py-5">
        <Link href="/dashboard/settings?tab=billing" className={buttonPrimaryClassName}>
          View in Billing & Purchases
        </Link>
        <Link
          href="/dashboard/store"
          className="rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm text-neutral-300 transition-colors hover:border-white/[0.18] hover:text-white"
        >
          Back to Store
        </Link>
      </div>
    </div>
  );
}
