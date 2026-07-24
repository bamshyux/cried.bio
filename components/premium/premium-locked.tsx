"use client";

import type { ReactNode } from "react";
import { useUpgradeModal } from "@/components/premium/upgrade-modal";
import type { EntitlementKey } from "@/lib/premium/types";

type PremiumLockedProps = {
  /** Whether the user has the required entitlement */
  allowed: boolean;
  /** Optional specific entitlement for messaging */
  entitlement?: EntitlementKey;
  /** Tier label shown on lock badge */
  tierLabel?: string;
  children: ReactNode;
  className?: string;
  /** When true, show children dimmed with overlay instead of replacing */
  overlay?: boolean;
  /** Custom overlay message */
  lockMessage?: string;
  /** Custom overlay CTA line */
  lockCta?: string;
};

export function PremiumLocked({
  allowed,
  tierLabel = "Premium Lite",
  children,
  className = "",
  overlay = true,
  lockMessage,
  lockCta = "Upgrade to unlock",
}: PremiumLockedProps) {
  const { openUpgrade } = useUpgradeModal();

  if (allowed) {
    return className ? <div className={className}>{children}</div> : <>{children}</>;
  }

  if (!overlay) {
    return (
      <button
        type="button"
        onClick={openUpgrade}
        className={`group w-full rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] p-4 text-left transition hover:border-amber-500/30 hover:bg-amber-500/[0.04] ${className}`}
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 group-hover:text-amber-200/90">
          <span aria-hidden>🔒</span>
          {tierLabel}
        </span>
        <p className="mt-1 text-xs text-neutral-600 group-hover:text-neutral-500">
          Click to upgrade and unlock this feature
        </p>
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none select-none opacity-40">{children}</div>
      <button
        type="button"
        onClick={openUpgrade}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-[#090909]/60 backdrop-blur-[2px] transition hover:bg-[#090909]/50"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-100">
          <span aria-hidden>🔒</span>
          {lockMessage ?? tierLabel}
        </span>
        <span className="max-w-xs text-center text-xs text-neutral-400">{lockCta}</span>
      </button>
    </div>
  );
}

export function PremiumLockBadge({
  tierLabel = "Premium Lite",
  onClick,
}: {
  tierLabel?: string;
  onClick?: () => void;
}) {
  const { openUpgrade } = useUpgradeModal();
  return (
    <button
      type="button"
      onClick={onClick ?? openUpgrade}
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-2.5 py-1 text-[11px] font-medium text-amber-200/90 transition hover:bg-amber-500/15"
    >
      <span aria-hidden>🔒</span>
      {tierLabel}
    </button>
  );
}
