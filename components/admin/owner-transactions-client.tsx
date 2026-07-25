"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CopyValueButton,
  PurchaseReceiptCard,
  PurchaseStatusPill,
} from "@/components/billing/purchase-ui";
import { cardClassName } from "@/components/dashboard/form-fields";
import {
  formatPurchaseAmount,
  searchPurchases,
  type PurchaseStats,
  type PurchaseWithCustomer,
} from "@/lib/data/purchases";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${cardClassName} p-5`}>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</p>
    </div>
  );
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function OwnerTransactionsClient({
  purchases,
  stats,
  initialReference,
}: {
  purchases: PurchaseWithCustomer[];
  stats: PurchaseStats;
  initialReference?: string | null;
}) {
  const [query, setQuery] = useState(initialReference ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (!initialReference) return null;
    const match = purchases.find(
      (purchase) => purchase.reference_id === initialReference.toUpperCase(),
    );
    return match?.id ?? null;
  });

  const filtered = useMemo(() => searchPurchases(purchases, query), [purchases, query]);
  const selected = filtered.find((purchase) => purchase.id === selectedId) ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Transactions</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Complete payment dashboard for cried.bio store purchases.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={money(stats.totalRevenue)} />
        <StatCard label="Revenue today" value={money(stats.revenueToday)} />
        <StatCard label="Revenue this month" value={money(stats.revenueThisMonth)} />
        <StatCard label="Revenue this year" value={money(stats.revenueThisYear)} />
        <StatCard label="Total purchases" value={String(stats.totalPurchases)} />
        <StatCard label="Refunds" value={String(stats.refundCount)} />
        <StatCard label="Support donations" value={money(stats.supportDonations)} />
        <StatCard label="Average order" value={money(stats.averageOrderValue)} />
      </div>

      <div className={`${cardClassName} p-0 overflow-hidden`}>
        <div className="border-b border-white/[0.06] px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent purchases</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Search by reference ID, Stripe payment ID, username, email, or product.
              </p>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search transactions…"
              className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-2.5 text-sm text-white outline-none ring-violet-500/40 placeholder:text-neutral-600 focus:border-violet-500/40 focus:ring-2 lg:max-w-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-white/[0.02] text-xs uppercase tracking-[0.12em] text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filtered.map((purchase) => (
                <tr
                  key={purchase.id}
                  className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                  onClick={() => setSelectedId(purchase.id)}
                >
                  <td className="px-5 py-4 font-mono text-xs text-violet-200">{purchase.reference_id}</td>
                  <td className="px-5 py-4">
                    <div className="text-white">{purchase.username ? `@${purchase.username}` : "—"}</div>
                    <div className="text-xs text-neutral-500">{purchase.email ?? "—"}</div>
                  </td>
                  <td className="px-5 py-4 text-neutral-200">{purchase.product_name}</td>
                  <td className="px-5 py-4 text-white">
                    {formatPurchaseAmount(purchase.amount_paid, purchase.currency)}
                  </td>
                  <td className="px-5 py-4">
                    <PurchaseStatusPill status={purchase.status} />
                  </td>
                  <td className="px-5 py-4 text-neutral-400">
                    {new Date(purchase.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <PurchaseReceiptCard purchase={selected} />
          <div className={`${cardClassName} h-fit space-y-4 p-5`}>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Customer</p>
              <p className="mt-1 text-sm text-white">
                {selected.display_name ?? selected.username ?? "Unknown user"}
              </p>
              <p className="text-xs text-neutral-500">{selected.email ?? "No email"}</p>
              {selected.username ? (
                <Link href={`/dashboard/admin/users/${selected.user_id}`} className="mt-2 inline-block text-xs text-violet-300 underline">
                  Open user profile
                </Link>
              ) : null}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Reference ID</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-mono text-sm text-white">{selected.reference_id}</span>
                <CopyValueButton value={selected.reference_id} />
              </div>
            </div>
            {selected.stripe_payment_intent ? (
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Stripe Payment ID</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-mono text-xs text-neutral-300">{selected.stripe_payment_intent}</span>
                  <CopyValueButton value={selected.stripe_payment_intent} />
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-xs text-neutral-500 hover:text-neutral-300"
            >
              Close panel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
