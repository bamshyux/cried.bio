"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  PREMIUM_LITE_BENEFITS,
  PREMIUM_LITE_LIFETIME_PRICE,
  PREMIUM_LITE_MONTHLY_PRICE,
  getBillingLabel,
  getTierDisplayName,
} from "@/lib/premium/constants";
import {
  PREMIUM_LITE_PRICE_LIFETIME,
  PREMIUM_LITE_PRICE_MONTHLY,
} from "@/lib/premium/types";
import type { UserEntitlements } from "@/lib/premium/types";
import { cardClassName, buttonPrimaryClassName } from "@/components/dashboard/form-fields";

function formatRenewalDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function PremiumPageClient({
  entitlements,
  hasStripeCustomer,
}: {
  entitlements: UserEntitlements;
  hasStripeCustomer: boolean;
}) {
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");
  const [loading, setLoading] = useState<"monthly" | "lifetime" | "portal" | null>(null);
  const [error, setError] = useState<string>();
  const [, startRefresh] = useTransition();

  const isPaid = entitlements.is_active && entitlements.plan_tier !== "free";
  const tierName = getTierDisplayName(entitlements);
  const billingLabel = getBillingLabel(entitlements);

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

  const openPortal = async () => {
    setLoading("portal");
    setError(undefined);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not open billing portal.");
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not open billing portal.");
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {checkoutStatus === "success" ? (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Payment successful — welcome to Premium Lite! Your entitlements will activate shortly.
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => startRefresh(() => window.location.replace("/dashboard/premium"))}
          >
            Refresh
          </button>
        </div>
      ) : null}
      {checkoutStatus === "canceled" ? (
        <div className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-neutral-400">
          Checkout was canceled. You can upgrade anytime.
        </div>
      ) : null}

      <div className="mb-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400/80">cried.bio Premium</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {isPaid ? "Your Premium plan" : "Upgrade your profile"}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-400">
          {isPaid
            ? "Manage your subscription and explore everything included in your plan."
            : "Unlock playlists, extra profile pages, scheduled presets, premium fonts, and more."}
        </p>
      </div>

      <div className={`${cardClassName} mb-6 border border-white/[0.08]`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Current tier</p>
            <p className="mt-1 text-3xl font-bold text-white">{tierName}</p>
          </div>
          {isPaid ? (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Active
            </span>
          ) : (
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-neutral-400">
              Free plan
            </span>
          )}
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white/[0.03] p-4">
            <dt className="text-xs text-neutral-500">Status</dt>
            <dd className="mt-1 text-sm font-medium text-white">
              {isPaid ? "Premium active" : "Free"}
            </dd>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4">
            <dt className="text-xs text-neutral-500">Plan</dt>
            <dd className="mt-1 text-sm font-medium text-white">
              {billingLabel ?? (isPaid ? tierName : "—")}
            </dd>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4">
            <dt className="text-xs text-neutral-500">
              {entitlements.lifetime ? "Membership" : "Next renewal"}
            </dt>
            <dd className="mt-1 text-sm font-medium text-white">
              {entitlements.lifetime
                ? "Lifetime Member"
                : isPaid
                  ? formatRenewalDate(entitlements.current_period_end)
                  : "—"}
            </dd>
          </div>
        </dl>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {!isPaid ? (
            <>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void startCheckout(PREMIUM_LITE_PRICE_MONTHLY, "monthly")}
                className={buttonPrimaryClassName}
              >
                {loading === "monthly"
                  ? "Redirecting…"
                  : `Upgrade — $${PREMIUM_LITE_MONTHLY_PRICE}/mo`}
              </button>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void startCheckout(PREMIUM_LITE_PRICE_LIFETIME, "lifetime")}
                className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-50"
              >
                {loading === "lifetime"
                  ? "Redirecting…"
                  : `Lifetime — $${PREMIUM_LITE_LIFETIME_PRICE}`}
              </button>
            </>
          ) : hasStripeCustomer && !entitlements.lifetime ? (
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => void openPortal()}
              className={buttonPrimaryClassName}
            >
              {loading === "portal" ? "Opening…" : "Manage Subscription"}
            </button>
          ) : null}
        </div>
      </div>

      <div className={`${cardClassName} border border-white/[0.06]`}>
        <h2 className="text-sm font-semibold text-white">
          {isPaid ? "Your Premium Lite benefits" : "Premium Lite includes"}
        </h2>
        <ul className="mt-4 space-y-3">
          {PREMIUM_LITE_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-sm text-neutral-300">
              <span className="mt-0.5 text-emerald-400" aria-hidden>
                ✓
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
