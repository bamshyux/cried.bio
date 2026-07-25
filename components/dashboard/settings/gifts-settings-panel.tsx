"use client";

import { useState } from "react";
import { cardClassName } from "@/components/dashboard/form-fields";
import type { GiftWithProfiles } from "@/lib/types/gift";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatus(status: string) {
  switch (status) {
    case "completed":
      return "Delivered";
    case "pending":
      return "Pending";
    case "failed":
      return "Failed";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

function GiftTable({
  rows,
  mode,
}: {
  rows: GiftWithProfiles[];
  mode: "received" | "sent";
}) {
  if (rows.length === 0) {
    return (
      <div className={`${cardClassName} p-8 text-center text-sm text-neutral-500`}>
        {mode === "received" ? "No gifts received yet." : "You haven't sent any gifts yet."}
      </div>
    );
  }

  return (
    <div className={`${cardClassName} overflow-hidden p-0`}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.02] text-xs uppercase tracking-[0.12em] text-neutral-500">
            <tr>
              <th className="px-5 py-3 font-medium">Product</th>
              {mode === "received" ? (
                <th className="px-5 py-3 font-medium">Sender</th>
              ) : (
                <th className="px-5 py-3 font-medium">Recipient</th>
              )}
              {mode === "received" ? (
                <th className="px-5 py-3 font-medium">Gift message</th>
              ) : null}
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Reference ID</th>
              {mode === "sent" ? <th className="px-5 py-3 font-medium">Status</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {rows.map((gift) => (
              <tr key={gift.id} className="hover:bg-white/[0.02]">
                <td className="px-5 py-4 text-white">{gift.product_name}</td>
                <td className="px-5 py-4 text-neutral-300">
                  {mode === "received"
                    ? gift.sender_username
                      ? `@${gift.sender_username}`
                      : "Unknown"
                    : gift.recipient_username
                      ? `@${gift.recipient_username}`
                      : "Unknown"}
                </td>
                {mode === "received" ? (
                  <td className="max-w-xs px-5 py-4 text-neutral-400">
                    {gift.gift_message ? (
                      <span className="italic">&ldquo;{gift.gift_message}&rdquo;</span>
                    ) : (
                      "—"
                    )}
                  </td>
                ) : null}
                <td className="px-5 py-4 text-neutral-400">{formatWhen(gift.created_at)}</td>
                <td className="px-5 py-4 font-mono text-xs text-violet-200">{gift.reference_id}</td>
                {mode === "sent" ? (
                  <td className="px-5 py-4 text-neutral-300">{formatStatus(gift.status)}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GiftsSettingsPanel({
  received,
  sent,
}: {
  received: GiftWithProfiles[];
  sent: GiftWithProfiles[];
}) {
  const [tab, setTab] = useState<"received" | "sent">("received");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Gifts</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Gifts you&apos;ve received and sent on cried.bio.
        </p>
      </div>

      <div className="flex gap-2">
        {(["received", "sent"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === value
                ? "bg-white/[0.08] text-white"
                : "text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-300"
            }`}
          >
            {value === "received" ? "Received" : "Sent"}
          </button>
        ))}
      </div>

      <GiftTable rows={tab === "received" ? received : sent} mode={tab} />
    </div>
  );
}
