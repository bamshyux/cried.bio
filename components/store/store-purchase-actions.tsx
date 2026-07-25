"use client";

import { GiftIcon } from "@/components/icons/gift-icon";
import { buttonPrimaryClassName } from "@/components/dashboard/form-fields";

export function StorePurchaseActions({
  buyLabel = "Buy",
  giftTooltip = "Buy as a gift",
  buyClassName,
  loading,
  disabled,
  giftDisabled,
  giftable,
  onBuy,
  onGift,
}: {
  buyLabel?: string;
  giftTooltip?: string;
  buyClassName?: string;
  loading?: boolean;
  disabled?: boolean;
  giftDisabled?: boolean;
  giftable?: boolean;
  onBuy: () => void;
  onGift: () => void;
}) {
  const buyButtonClass = buyClassName ?? buttonPrimaryClassName;
  const giftIsDisabled = giftDisabled ?? disabled;

  if (!giftable) {
    return (
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onBuy}
        className={`${buyButtonClass} inline-flex w-full items-center justify-center`}
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
        className={`${buyButtonClass} bf-store-actions__buy`}
      >
        {loading ? "Redirecting…" : buyLabel}
      </button>

      <span className="bf-store-actions__gift-wrap">
        <button
          type="button"
          disabled={giftIsDisabled}
          onClick={onGift}
          className="bf-store-actions__gift"
          aria-label={giftTooltip}
        >
          <GiftIcon size={17} variant="minimal" />
        </button>
        <span className="bf-store-actions__gift-tip" role="tooltip">
          {giftTooltip}
        </span>
      </span>
    </div>
  );
}
