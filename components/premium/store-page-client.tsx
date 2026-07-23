"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { PremiumFeaturePreviewVisual } from "@/components/premium/premium-feature-preview";
import type { PremiumFeaturePreview } from "@/lib/premium/comparison-features";
import { buttonPrimaryClassName, cardClassName, inputClassName, labelClassName } from "@/components/dashboard/form-fields";
import type { StoreProduct } from "@/lib/types/store";
import { GiftModal } from "@/components/premium/gift-modal";
import { readJsonResponse } from "@/lib/stripe/client-fetch";

const PREVIEW_BY_SLUG: Record<string, PremiumFeaturePreview> = {
  "custom-badge": "badge",
  "verified-badge": "badge",
  "username-reservation": "customize",
  "profile-boost": "analytics",
  "extra-profile-page": "pages",
  "custom-badge-slot": "badge",
  "theme-pack": "fonts",
  "supporter-pack": "badge",
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function StoreProductCard({
  product,
  owned,
  buyerUsername,
  stripeConfigured,
  onError,
}: {
  product: StoreProduct;
  owned: boolean;
  buyerUsername: string | null;
  stripeConfigured: boolean;
  onError: (message: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [reservedUsername, setReservedUsername] = useState("");
  const isComingSoon = product.status === "coming_soon";
  const needsReservedUsername = product.slug === "username-reservation";
  const preview = PREVIEW_BY_SLUG[product.slug] ?? "customize";

  const purchase = async (reserved?: string) => {
    if (isComingSoon || owned) return;
    if (needsReservedUsername && !reserved?.trim()) {
      setReserveOpen(true);
      return;
    }
    setLoading(true);
    onError("");
    try {
      const res = await fetch("/api/stripe/store-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          reservedUsername: reserved?.trim().toLowerCase() || undefined,
        }),
      });
      const data = await readJsonResponse<{ url?: string; error?: string }>(res);
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed.");
      window.location.href = data.url;
    } catch (err) {
      onError(err instanceof Error ? err.message : "Checkout failed.");
      setLoading(false);
    }
  };

  return (
    <>
      <article
        className={`${cardClassName} relative flex h-full flex-col overflow-hidden border transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isComingSoon
            ? "border-white/[0.05] opacity-55"
            : "border-white/[0.08] hover:border-white/[0.12] hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
        }`}
      >
        {product.badge_label ? (
          <span className="absolute right-4 top-4 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-200">
            {product.badge_label}
          </span>
        ) : null}

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-2xl">
          {product.icon}
        </div>

        <h3 className="text-lg font-semibold text-white">{product.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">{product.description}</p>

        {!isComingSoon ? (
          <p className="mt-4 text-2xl font-bold tracking-tight text-white">
            {formatPrice(product.price_cents)}
            <span className="ml-1 text-sm font-normal text-neutral-500">once</span>
          </p>
        ) : (
          <p className="mt-4 text-sm font-medium uppercase tracking-wider text-neutral-500">Coming Soon</p>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 flex items-center gap-2 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 transition-colors hover:text-neutral-300"
        >
          {expanded ? "Hide details" : "View included"}
          <span className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}>▾</span>
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <ul className="mt-3 space-y-2 border-t border-white/[0.06] pt-4 text-sm text-neutral-300">
              {product.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            {!isComingSoon ? (
              <div className="mt-4 max-w-[12rem]">
                <PremiumFeaturePreviewVisual type={preview} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          {!isComingSoon ? (
            <>
              <button
                type="button"
                disabled={loading || owned || !stripeConfigured}
                onClick={() => void purchase()}
                className={`${buttonPrimaryClassName} flex-1`}
              >
                {owned ? "Owned" : loading ? "Redirecting…" : "Purchase"}
              </button>
              {product.is_giftable ? (
                <button
                  type="button"
                  disabled={!stripeConfigured}
                  onClick={() => setGiftOpen(true)}
                  className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:border-white/[0.16] hover:bg-white/[0.06]"
                >
                  Gift
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </article>

      {giftOpen ? (
        <GiftModal
          open={giftOpen}
          onClose={() => setGiftOpen(false)}
          target={{ kind: "store", productSlug: product.slug }}
          productName={product.name}
          priceLabel={formatPrice(product.price_cents)}
          buyerUsername={buyerUsername}
          onError={onError}
        />
      ) : null}

      {reserveOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setReserveOpen(false)}
        >
          <div className={`${cardClassName} w-full max-w-md border border-white/[0.1] p-6`} onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-medium uppercase tracking-wider text-amber-400/90">Username Reservation</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Choose a username to reserve</h2>
            <p className="mt-2 text-sm text-neutral-400">
              This name stays yours forever, even if you change usernames later.
            </p>
            <div className="mt-4">
              <label className={labelClassName} htmlFor={`reserve-${product.slug}`}>
                Username to reserve
              </label>
              <input
                id={`reserve-${product.slug}`}
                value={reservedUsername}
                onChange={(e) => setReservedUsername(e.target.value.toLowerCase())}
                placeholder="your-name"
                className={inputClassName}
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setReserveOpen(false)}
                className="flex-1 rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !reservedUsername.trim()}
                onClick={() => void purchase(reservedUsername)}
                className={`${buttonPrimaryClassName} flex-1`}
              >
                {loading ? "Redirecting…" : "Continue to checkout"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function StorePageClient({
  products,
  ownedSlugs,
  buyerUsername,
  stripeConfigured,
  stripeConfigError,
}: {
  products: StoreProduct[];
  ownedSlugs: string[];
  buyerUsername: string | null;
  stripeConfigured: boolean;
  stripeConfigError: string | null;
}) {
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");
  const [error, setError] = useState<string>();
  const [, startRefresh] = useTransition();
  const owned = useMemo(() => new Set(ownedSlugs), [ownedSlugs]);

  const active = products.filter((p) => p.status === "active");
  const comingSoon = products.filter((p) => p.status === "coming_soon");

  return (
    <div className="mx-auto max-w-6xl">
      {checkoutStatus === "success" ? (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Purchase successful — your upgrade will activate shortly.
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => startRefresh(() => window.location.replace("/dashboard/premium/store"))}
          >
            Refresh
          </button>
        </div>
      ) : null}
      {checkoutStatus === "canceled" ? (
        <div className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-neutral-400">
          Checkout was canceled. You can purchase anytime.
        </div>
      ) : null}

      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Store</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-400 sm:text-base">
          Unlock exclusive upgrades, cosmetics, and account enhancements.
        </p>
      </div>

      {!stripeConfigured && stripeConfigError ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {stripeConfigError}
        </div>
      ) : null}

      {error ? <p className="mb-6 text-sm text-red-400">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {active.map((product) => (
          <StoreProductCard
            key={product.id}
            product={product}
            owned={owned.has(product.slug)}
            buyerUsername={buyerUsername}
            stripeConfigured={stripeConfigured}
            onError={setError}
          />
        ))}
      </div>

      {comingSoon.length ? (
        <section className="mt-14">
          <h2 className="mb-6 text-center text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
            Coming Soon
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {comingSoon.map((product) => (
              <StoreProductCard
                key={product.id}
                product={product}
                owned={false}
                buyerUsername={buyerUsername}
                stripeConfigured={stripeConfigured}
                onError={setError}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
