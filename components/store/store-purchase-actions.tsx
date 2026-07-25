"use client";

import { GiftIcon } from "@/components/icons/gift-icon";
import { buttonPrimaryClassName } from "@/components/dashboard/form-fields";

export function StorePurchaseActions({
  buyLabel = "Buy for myself",
  giftLabel = "Gift",
  loading,
  disabled,
  giftable,
  onBuy,
  onGift,
}: {
  buyLabel?: string;
  giftLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  giftable?: boolean;
  onBuy: () => void;
  onGift: () => void;
}) {
  if (!giftable) {
    return (
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onBuy}
        className={`${buttonPrimaryClassName} inline-flex w-full items-center justify-center`}
      >
        {loading ? "Redirecting…" : buyLabel}
      </button>
    );
  }

  return (
    <div className="bf-store-actions">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onBuy}
        className={`${buttonPrimaryClassName} bf-store-actions__buy`}
      >
        {loading ? "Redirecting…" : buyLabel}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onGift}
        className="bf-store-actions__gift"
        aria-label="Gift to someone"
      >
        <GiftIcon size={16} variant="minimal" className="shrink-0 opacity-80" />
        <span>{giftLabel}</span>
      </button>
    </div>
  );
}
