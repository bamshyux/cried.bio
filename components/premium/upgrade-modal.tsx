"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  PREMIUM_LITE_BENEFITS,
  PREMIUM_LITE_LIFETIME_PRICE,
  PREMIUM_LITE_MONTHLY_PRICE,
} from "@/lib/premium/constants";
import {
  PREMIUM_LITE_PRICE_LIFETIME,
  PREMIUM_LITE_PRICE_MONTHLY,
} from "@/lib/premium/types";
import { cardClassName, buttonPrimaryClassName } from "@/components/dashboard/form-fields";

type UpgradeModalContextValue = {
  openUpgrade: () => void;
  closeUpgrade: () => void;
};

const UpgradeModalContext = createContext<UpgradeModalContextValue | null>(null);

export function useUpgradeModal() {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx) {
    return {
      openUpgrade: () => {
        window.location.href = "/dashboard/premium";
      },
      closeUpgrade: () => {},
    };
  }
  return ctx;
}

function BenefitRow({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-neutral-300">
      <span className="mt-0.5 text-emerald-400" aria-hidden>
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState<"monthly" | "lifetime" | null>(null);
  const [error, setError] = useState<string>();

  if (!open) return null;

  const startCheckout = async (priceId: string, type: "monthly" | "lifetime") => {
    setLoading(type);
    setError(undefined);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout failed.");
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not start checkout.");
      setLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      onClick={onClose}
    >
      <div
        className={`${cardClassName} relative w-full max-w-md border border-white/[0.08] p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-500 transition hover:bg-white/[0.06] hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400/90">Premium Lite</p>
          <h2 id="upgrade-modal-title" className="mt-1 text-xl font-semibold text-white">
            Unlock Premium Lite
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Upgrade your cried.bio profile with powerful creator tools.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
            <p className="text-2xl font-bold text-white">${PREMIUM_LITE_MONTHLY_PRICE}</p>
            <p className="text-xs text-neutral-500">per month</p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4 text-center">
            <p className="text-2xl font-bold text-white">${PREMIUM_LITE_LIFETIME_PRICE}</p>
            <p className="text-xs text-amber-400/80">lifetime</p>
          </div>
        </div>

        <ul className="mb-6 space-y-2">
          {PREMIUM_LITE_BENEFITS.map((benefit) => (
            <BenefitRow key={benefit}>{benefit}</BenefitRow>
          ))}
        </ul>

        {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void startCheckout(PREMIUM_LITE_PRICE_MONTHLY, "monthly")}
            className={`${buttonPrimaryClassName} flex-1`}
          >
            {loading === "monthly" ? "Redirecting…" : "Upgrade Monthly"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void startCheckout(PREMIUM_LITE_PRICE_LIFETIME, "lifetime")}
            className="flex-1 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-50"
          >
            {loading === "lifetime" ? "Redirecting…" : "Buy Lifetime"}
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl px-4 py-2 text-sm text-neutral-500 transition hover:text-neutral-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openUpgrade = useCallback(() => setOpen(true), []);
  const closeUpgrade = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ openUpgrade, closeUpgrade }), [openUpgrade, closeUpgrade]);

  return (
    <UpgradeModalContext.Provider value={value}>
      {children}
      <UpgradeModal open={open} onClose={closeUpgrade} />
    </UpgradeModalContext.Provider>
  );
}
