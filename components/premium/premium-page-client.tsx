"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  PREMIUM_LITE_LIFETIME_PRICE,
  PREMIUM_LITE_MONTHLY_PRICE,
  getBillingLabel,
  getTierDisplayName,
} from "@/lib/premium/constants";
import type { UserEntitlements } from "@/lib/premium/types";
import { readJsonResponse } from "@/lib/stripe/client-fetch";
import {
  cardClassName,
  buttonPrimaryClassName,
  dashboardStackClassName,
} from "@/components/dashboard/form-fields";
import { PremiumComparisonSection } from "@/components/premium/premium-comparison-section";
import { GiftModal } from "@/components/premium/gift-modal";

function formatRenewalDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function startStripeCheckout(plan: "monthly" | "lifetime") {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  const data = await readJsonResponse<{ url?: string; error?: string }>(res);
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Checkout failed.");
  }
  window.location.href = data.url;
}

function PricingCard({
  title,
  price,
  period,
  highlight,
  disabled,
  loading,
  onSelect,
  onGift,
  giftDisabled,
}: {
  title: string;
  price: string;
  period: string;
  highlight?: boolean;
  disabled: boolean;
  loading: boolean;
  onSelect: () => void;
  onGift?: () => void;
  giftDisabled?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        highlight
          ? "border-[rgba(201,184,150,0.22)] bg-[rgba(201,184,150,0.04)] shadow-[0_0_0_1px_rgba(201,184,150,0.08),0_16px_48px_rgba(0,0,0,0.35)]"
          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]"
      }`}
    >
      {highlight ? (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-[rgba(201,184,150,0.28)] bg-[#141414] px-3 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#d4c4a8]">
          Best value
        </span>
      ) : null}

      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{title}</p>
      <p className="mt-2 text-[1.75rem] font-bold tracking-tight text-white">{price}</p>
      <p className="mt-0.5 text-sm text-neutral-500">{period}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onSelect}
          className={`flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:cursor-not-allowed disabled:opacity-50 ${
            highlight
              ? "bg-[rgba(201,184,150,0.12)] text-[#ebe3cf] ring-1 ring-[rgba(201,184,150,0.28)] hover:bg-[rgba(201,184,150,0.18)]"
              : buttonPrimaryClassName
          }`}
        >
          {loading ? "Redirecting…" : "Upgrade"}
        </button>
        {onGift ? (
          <button
            type="button"
            disabled={giftDisabled}
            onClick={onGift}
            className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:border-white/[0.16] hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Gift
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function PremiumPageClient({
  entitlements,
  hasStripeCustomer,
  stripeConfigured,
  stripeConfigError,
  buyerUsername,
}: {
  entitlements: UserEntitlements;
  hasStripeCustomer: boolean;
  stripeConfigured: boolean;
  stripeConfigError: string | null;
  buyerUsername: string | null;
}) {
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");
  const [loading, setLoading] = useState<"monthly" | "lifetime" | "portal" | null>(null);
  const [error, setError] = useState<string>();
  const [giftPlan, setGiftPlan] = useState<"monthly" | "lifetime" | null>(null);
  const [, startRefresh] = useTransition();

  const isPaid = entitlements.is_active && entitlements.plan_tier !== "free";
  const tierName = getTierDisplayName(entitlements);
  const billingLabel = getBillingLabel(entitlements);

  const handleCheckout = async (plan: "monthly" | "lifetime") => {
    if (!stripeConfigured) {
      setError(stripeConfigError ?? "Stripe is not configured.");
      return;
    }

    setLoading(plan);
    setError(undefined);
    try {
      await startStripeCheckout(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setLoading(null);
    }
  };

  const openPortal = async () => {
    setLoading("portal");
    setError(undefined);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await readJsonResponse<{ url?: string; error?: string }>(res);
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
    <div className="mx-auto max-w-4xl">
      {checkoutStatus === "success" ? (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Payment successful — welcome to Premium Lite! Your entitlements will activate shortly.
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => startRefresh(() => window.location.replace("/dashboard/premium/plans"))}
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

      {!stripeConfigured && stripeConfigError ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {stripeConfigError}
        </div>
      ) : null}

      <div className="mb-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9b896]/75">
          cried.bio Premium
        </p>
        <h1 className="mt-2.5 text-[1.875rem] font-semibold tracking-tight text-white sm:text-[2.125rem]">
          {isPaid ? "Your Premium plan" : "Upgrade your profile"}
        </h1>
        <p className="mx-auto mt-2.5 max-w-lg text-sm leading-relaxed text-neutral-500">
          {isPaid
            ? "Manage your subscription and explore everything included in your plan."
            : "Unlock playlists, extra profile pages, scheduled presets, premium fonts, and more."}
        </p>
      </div>

      <div className={`${dashboardStackClassName} gap-5`}>
        <div className={`${cardClassName} border border-white/[0.07] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Current tier
              </p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight text-white">{tierName}</p>
            </div>
            {isPaid ? (
              <span className="rounded-full border border-[rgba(201,184,150,0.28)] bg-[rgba(201,184,150,0.08)] px-3 py-1 text-xs font-medium text-[#d4c4a8]">
                Active
              </span>
            ) : (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-neutral-400">
                Free plan
              </span>
            )}
          </div>

          <dl className="mt-4 grid gap-2.5 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] px-3.5 py-2.5">
              <dt className="text-[11px] text-neutral-500">Status</dt>
              <dd className="mt-0.5 text-sm font-medium text-white">
                {isPaid ? "Premium active" : "Free"}
              </dd>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] px-3.5 py-2.5">
              <dt className="text-[11px] text-neutral-500">Plan</dt>
              <dd className="mt-0.5 text-sm font-medium text-white">
                {billingLabel ?? (isPaid ? tierName : "—")}
              </dd>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] px-3.5 py-2.5">
              <dt className="text-[11px] text-neutral-500">
                {entitlements.lifetime ? "Membership" : "Next renewal"}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-white">
                {entitlements.lifetime
                  ? "Lifetime Member"
                  : isPaid
                    ? formatRenewalDate(entitlements.current_period_end)
                    : "—"}
              </dd>
            </div>
          </dl>

          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

          {isPaid && hasStripeCustomer && !entitlements.lifetime ? (
            <div className="mt-4">
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void openPortal()}
                className={buttonPrimaryClassName}
              >
                {loading === "portal" ? "Opening…" : "Manage Subscription"}
              </button>
            </div>
          ) : null}
        </div>

        {!isPaid ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <PricingCard
              title="Premium Lite"
              price={`$${PREMIUM_LITE_MONTHLY_PRICE}`}
              period="per month · cancel anytime"
              disabled={loading !== null || !stripeConfigured}
              loading={loading === "monthly"}
              onSelect={() => void handleCheckout("monthly")}
              onGift={() => setGiftPlan("monthly")}
              giftDisabled={!stripeConfigured}
            />
            <PricingCard
              title="Premium Lite Lifetime"
              price={`$${PREMIUM_LITE_LIFETIME_PRICE}`}
              period="one-time · yours forever"
              highlight
              disabled={loading !== null || !stripeConfigured}
              loading={loading === "lifetime"}
              onSelect={() => void handleCheckout("lifetime")}
              onGift={() => setGiftPlan("lifetime")}
              giftDisabled={!stripeConfigured}
            />
          </div>
        ) : null}

        <PremiumComparisonSection />
      </div>

      {giftPlan ? (
        <GiftModal
          open
          onClose={() => setGiftPlan(null)}
          target={{ kind: "premium", plan: giftPlan }}
          productName={giftPlan === "monthly" ? "Premium Lite (Monthly)" : "Premium Lite (Lifetime)"}
          priceLabel={giftPlan === "monthly" ? `$${PREMIUM_LITE_MONTHLY_PRICE}/mo` : `$${PREMIUM_LITE_LIFETIME_PRICE} once`}
          buyerUsername={buyerUsername}
          onError={setError}
        />
      ) : null}
    </div>
  );
}
