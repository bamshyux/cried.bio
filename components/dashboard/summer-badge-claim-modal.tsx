"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { claimSummer2026BadgeAction } from "@/app/actions/badges";
import { BadgeMedallion } from "@/components/badges/badge-medallion";
import { buttonPrimaryClassName } from "@/components/dashboard/form-fields";
import {
  SUMMER_2026_BADGE_COLOR,
  SUMMER_2026_CLAIM_SESSION_KEY,
} from "@/lib/badges/seasonal-events";

type SummerBadgeClaimModalProps = {
  open: boolean;
  onClose: () => void;
  onClaimed: () => void;
};

export function SummerBadgeClaimModal({ open, onClose, onClaimed }: SummerBadgeClaimModalProps) {
  const [mounted, setMounted] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) handleDismiss();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, isPending]);

  const handleDismiss = useCallback(() => {
    if (isPending) return;
    sessionStorage.setItem(SUMMER_2026_CLAIM_SESSION_KEY, "1");
    onClose();
  }, [isPending, onClose]);

  const handleClaim = () => {
    setError(null);
    startTransition(async () => {
      const result = await claimSummer2026BadgeAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      setClaimed(true);
      sessionStorage.removeItem(SUMMER_2026_CLAIM_SESSION_KEY);
      onClaimed();
      window.setTimeout(() => onClose(), 2200);
    });
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="bf-summer-claim-backdrop fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bf-summer-claim-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        aria-label="Close"
        onClick={handleDismiss}
        disabled={isPending}
      />

      <div className="bf-summer-claim-modal relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-400/25 shadow-[0_0_80px_rgba(251,191,36,0.35),0_0_160px_rgba(249,115,22,0.15)]">
        <div className="bf-summer-claim-rays pointer-events-none absolute inset-0" aria-hidden />
        <div className="bf-summer-claim-shimmer pointer-events-none absolute inset-0" aria-hidden />

        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="bf-summer-claim-spark pointer-events-none absolute h-1 w-1 rounded-full bg-amber-200/80"
            style={{
              left: `${12 + i * 14}%`,
              top: `${18 + (i % 3) * 22}%`,
              animationDelay: `${i * 0.35}s`,
            }}
            aria-hidden
          />
        ))}

        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isPending}
            className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/40 p-1.5 text-neutral-400 transition hover:text-white disabled:opacity-40"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>

          <div className="text-center">
            <p className="bf-summer-claim-eyebrow inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200">
              <span className="bf-summer-claim-pulse-dot h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden />
              Limited time
            </p>

            <h2
              id="bf-summer-claim-title"
              className="bf-summer-claim-title mt-5 text-2xl font-black uppercase leading-tight tracking-tight text-white sm:text-3xl"
            >
              Exclusive Summer Event Badge
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-amber-100/70">
              Claim your free <span className="font-semibold text-amber-200">Summer 2026</span> badge and show it off on your profile all season.
            </p>

            <div className="relative mx-auto mt-8 flex h-32 w-32 items-center justify-center">
              <BadgeMedallion
                badge={{ slug: "summer-2026", color: SUMMER_2026_BADGE_COLOR, rarity: "epic" }}
                size={72}
                glowEnabled={false}
              />
            </div>

            <p className="mt-4 text-xs font-medium uppercase tracking-[0.22em] text-amber-300/85">
              Summer Event · Epic · Seasonal
            </p>

            {claimed ? (
              <div className="bf-summer-claim-success mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-4">
                <p className="text-lg font-bold text-emerald-200">Claimed!</p>
                <p className="mt-1 text-sm text-emerald-100/70">Your Summer Event badge is live on your profile.</p>
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                {error ? (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={isPending}
                  className={`${buttonPrimaryClassName} bf-summer-claim-cta w-full py-3.5 text-sm font-bold uppercase tracking-[0.16em]`}
                >
                  {isPending ? "Claiming..." : "Claim badge"}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={isPending}
                  className="w-full py-2 text-xs font-medium text-neutral-500 transition hover:text-neutral-300 disabled:opacity-40"
                >
                  Maybe later
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function useSummerBadgeClaimModal(hasBadge: boolean, campaignActive: boolean) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hasBadge || !campaignActive) return;
    if (sessionStorage.getItem(SUMMER_2026_CLAIM_SESSION_KEY)) return;
    const timer = window.setTimeout(() => setOpen(true), 450);
    return () => window.clearTimeout(timer);
  }, [hasBadge, campaignActive]);

  return {
    open,
    close: () => setOpen(false),
  };
}
