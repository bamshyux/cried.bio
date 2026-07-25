"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buttonPrimaryClassName, cardClassName } from "@/components/dashboard/form-fields";
import type { StorePriceDisplay } from "@/lib/stripe/store-prices";
import {
  getRouteForCreditType,
  type StoreBadgeCredit,
} from "@/lib/store/badge-credits-shared";
import {
  type StoreCatalogEntry,
} from "@/lib/store/catalog";
import { readJsonResponse } from "@/lib/stripe/client-fetch";

function badgeCreationPath(credit: StoreBadgeCredit): string {
  return `/dashboard/store/create-badge/${getRouteForCreditType(credit.credit_type)}`;
}

function StoreProductCard({
  product,
  price,
  owned,
  pendingCredit,
  stripeConfigured,
  onError,
}: {
  product: StoreCatalogEntry;
  price?: StorePriceDisplay;
  owned: boolean;
  pendingCredit?: StoreBadgeCredit;
  stripeConfigured: boolean;
  onError: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const buy = async () => {
    if (owned && !product.allowRepeatPurchase) return;
    setLoading(true);
    onError("");
    try {
      const res = await fetch("/api/stripe/store-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug: product.slug }),
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
    <article className={`${cardClassName} relative flex h-full flex-col`}>
      {product.badgeLabel ? (
        <span className="absolute right-4 top-4 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-200">
          {product.badgeLabel}
        </span>
      ) : null}

      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-2xl">
        {product.icon}
      </div>

      <h3 className="text-lg font-semibold text-white">{product.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-400">{product.description}</p>

      <ul className="mt-4 space-y-1.5 text-sm text-neutral-500">
        {product.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="text-violet-400">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <p className="mb-4 text-2xl font-bold tracking-tight text-white">
          {price?.formatted ?? "—"}
          {product.category === "support" ? (
            <span className="ml-1 text-sm font-normal text-neutral-500">donation</span>
          ) : (
            <span className="ml-1 text-sm font-normal text-neutral-500">once</span>
          )}
        </p>

        {owned && !product.allowRepeatPurchase ? (
          pendingCredit ? (
            <Link
              href={badgeCreationPath(pendingCredit)}
              className={`${buttonPrimaryClassName} inline-flex w-full items-center justify-center`}
            >
              Continue badge setup
            </Link>
          ) : (
            <span className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200">
              Owned
            </span>
          )
        ) : (
          <button
            type="button"
            disabled={!stripeConfigured || loading}
            onClick={() => void buy()}
            className={buttonPrimaryClassName}
          >
            {loading ? "Redirecting…" : "Buy"}
          </button>
        )}
      </div>
    </article>
  );
}

export function StorePageClient({
  products,
  prices,
  ownedSlugs,
  pendingCredits,
  stripeConfigured,
  stripeConfigError,
}: {
  products: StoreCatalogEntry[];
  prices: Record<string, StorePriceDisplay>;
  ownedSlugs: string[];
  pendingCredits: StoreBadgeCredit[];
  stripeConfigured: boolean;
  stripeConfigError: string | null;
}) {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "true";
  const [error, setError] = useState<string>();
  const owned = useMemo(() => new Set(ownedSlugs), [ownedSlugs]);
  const pendingByProduct = useMemo(() => {
    const map = new Map<string, StoreBadgeCredit>();
    for (const credit of pendingCredits) {
      if (credit.credit_type === "static_single") map.set("custom-badge-1", credit);
      if (credit.credit_type === "static_triple") map.set("custom-badges-3", credit);
      if (credit.credit_type === "animated_single") map.set("animated-badge", credit);
    }
    return map;
  }, [pendingCredits]);
  const badges = products.filter((p) => p.category === "badges");
  const support = products.filter((p) => p.category === "support");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Store</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-400">
            One-time upgrades, badges, and ways to support cried.bio.
          </p>
        </div>
        <Link
          href="/dashboard/settings?tab=billing"
          className="rounded-xl border border-white/[0.1] px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-white/[0.18] hover:text-white"
        >
          Billing & Purchases
        </Link>
      </div>

      {cancelled ? (
        <div className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-neutral-400">
          Checkout was cancelled. You can purchase anytime.
        </div>
      ) : null}

      {!stripeConfigured && stripeConfigError ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {stripeConfigError}
        </div>
      ) : null}

      {error ? <p className="mb-6 text-sm text-red-400">{error}</p> : null}

      <section className="mb-12">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">Badges</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {badges.map((product) => (
            <StoreProductCard
              key={product.slug}
              product={product}
              price={prices[product.slug]}
              owned={owned.has(product.slug)}
              pendingCredit={pendingByProduct.get(product.slug)}
              stripeConfigured={stripeConfigured}
              onError={setError}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
          Support cried.bio
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {support.map((product) => (
            <StoreProductCard
              key={product.slug}
              product={product}
              price={prices[product.slug]}
              owned={false}
              stripeConfigured={stripeConfigured}
              onError={setError}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
