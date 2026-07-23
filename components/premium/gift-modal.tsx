"use client";

import { useState } from "react";
import { cardClassName, buttonPrimaryClassName, inputClassName, labelClassName } from "@/components/dashboard/form-fields";
import { readJsonResponse } from "@/lib/stripe/client-fetch";
import type { GiftCheckoutTarget } from "@/lib/types/store";

export function GiftModal({
  open,
  onClose,
  target,
  productName,
  priceLabel,
  buyerUsername,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  target: GiftCheckoutTarget;
  productName: string;
  priceLabel: string;
  buyerUsername: string | null;
  onError: (message: string) => void;
}) {
  const [recipientUsername, setRecipientUsername] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [reservedUsername, setReservedUsername] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const needsReservedUsername =
    target.kind === "store" && target.productSlug === "username-reservation";

  const continueGift = async () => {
    const recipient = recipientUsername.trim().toLowerCase();
    if (!recipient) {
      onError("Enter a recipient username.");
      return;
    }
    if (buyerUsername && recipient === buyerUsername.toLowerCase()) {
      onError("You cannot gift an item to yourself. Use Purchase instead.");
      return;
    }
    if (needsReservedUsername && !reservedUsername.trim()) {
      onError("Enter the username to reserve.");
      return;
    }

    setLoading(true);
    onError("");
    try {
      const body =
        target.kind === "store"
          ? {
              productSlug: target.productSlug,
              recipientUsername: recipient,
              giftMessage: giftMessage.trim() || undefined,
              reservedUsername: reservedUsername.trim() || undefined,
            }
          : {
              plan: target.plan,
              recipientUsername: recipient,
              giftMessage: giftMessage.trim() || undefined,
              premiumGift: true,
            };

      const endpoint =
        target.kind === "store" ? "/api/stripe/store-checkout" : "/api/stripe/checkout";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readJsonResponse<{ url?: string; error?: string }>(res);
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not start gift checkout.");
      window.location.href = data.url;
    } catch (err) {
      onError(err instanceof Error ? err.message : "Gift checkout failed.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className={`${cardClassName} w-full max-w-md border border-white/[0.1] p-6`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-amber-400/90">Gift</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Send a gift</h2>
            <p className="mt-2 text-sm text-neutral-400">
              {productName} · {priceLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClassName} htmlFor="gift-recipient">
              Recipient username
            </label>
            <input
              id="gift-recipient"
              value={recipientUsername}
              onChange={(e) => setRecipientUsername(e.target.value)}
              placeholder="username"
              className={inputClassName}
            />
          </div>

          {needsReservedUsername ? (
            <div>
              <label className={labelClassName} htmlFor="gift-reserved-username">
                Username to reserve
              </label>
              <input
                id="gift-reserved-username"
                value={reservedUsername}
                onChange={(e) => setReservedUsername(e.target.value)}
                placeholder="reserved-name"
                className={inputClassName}
              />
            </div>
          ) : null}

          <div>
            <label className={labelClassName} htmlFor="gift-message">
              Gift message <span className="text-neutral-600">(optional)</span>
            </label>
            <textarea
              id="gift-message"
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              rows={3}
              placeholder="Enjoy this upgrade!"
              className={inputClassName}
            />
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm text-neutral-400">
            <p className="font-medium text-white">Summary</p>
            <p className="mt-2">
              You&apos;re gifting <span className="text-neutral-200">{productName}</span> to{" "}
              <span className="text-neutral-200">@{recipientUsername.trim() || "…"}</span>.
            </p>
            <p className="mt-1">Total: {priceLabel}</p>
            <p className="mt-2 text-xs text-neutral-500">
              Successful gifts award you the exclusive 🎁 Gifter badge.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-white/[0.04]">
            Cancel
          </button>
          <button type="button" disabled={loading} onClick={() => void continueGift()} className={`${buttonPrimaryClassName} flex-1`}>
            {loading ? "Redirecting…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
