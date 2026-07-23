"use client";

import { useState } from "react";
import {
  PREMIUM_COMPARISON_FEATURES,
  type FeatureAvailability,
  type PremiumComparisonFeature,
} from "@/lib/premium/comparison-features";
import { PremiumFeaturePreviewVisual } from "@/components/premium/premium-feature-preview";
import { cardClassName } from "@/components/dashboard/form-fields";

function AvailabilityCell({ value }: { value: FeatureAvailability }) {
  if (value.kind === "included") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
        <span aria-hidden className="text-base leading-none">
          ✓
        </span>
        Included
      </span>
    );
  }

  if (value.kind === "excluded") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-neutral-500">
        <span aria-hidden className="text-base leading-none text-neutral-600">
          ✕
        </span>
        Not included
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-neutral-300">
      <span aria-hidden className="text-base leading-none text-amber-400/90">
        ◐
      </span>
      {value.label}
    </span>
  );
}

function ComparisonRow({
  feature,
  open,
  onToggle,
}: {
  feature: PremiumComparisonFeature;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left transition-colors duration-300 hover:bg-white/[0.02] sm:grid-cols-[minmax(0,1fr)_7rem_9rem_2.5rem] sm:gap-3 sm:px-5"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="text-lg leading-none" aria-hidden>
            {feature.icon}
          </span>
          <span className="text-sm font-medium text-white sm:text-[15px]">{feature.name}</span>
        </span>

        <span className="hidden sm:block">
          <AvailabilityCell value={feature.free} />
        </span>

        <span className="hidden sm:block">
          <AvailabilityCell value={feature.premium} />
        </span>

        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center justify-self-end rounded-lg border border-white/[0.08] bg-white/[0.03] text-neutral-500 transition-all duration-300 group-hover:border-white/[0.12] group-hover:text-neutral-300 sm:justify-self-center ${
            open ? "rotate-180 bg-white/[0.06] text-white" : ""
          }`}
          aria-hidden
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </span>
      </button>

      <div
        className={`bf-premium-compare-expand grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/[0.04] bg-white/[0.015] px-4 pb-5 pt-4 sm:px-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-4">
                <p className="text-sm leading-relaxed text-neutral-400">{feature.description}</p>

                <div className="flex flex-wrap gap-4 sm:hidden">
                  <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-neutral-600">
                      Free
                    </p>
                    <AvailabilityCell value={feature.free} />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-amber-400/70">
                      Premium Lite
                    </p>
                    <AvailabilityCell value={feature.premium} />
                  </div>
                </div>
              </div>

              <PremiumFeaturePreviewVisual type={feature.preview} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PremiumComparisonSection() {
  const [openId, setOpenId] = useState<string | null>(PREMIUM_COMPARISON_FEATURES[0]?.id ?? null);

  return (
    <section className="mt-2">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Everything you unlock with Premium
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-400 sm:text-base">
          See exactly what&apos;s included with Premium Lite and why it&apos;s worth upgrading.
        </p>
      </div>

      <div className={`${cardClassName} overflow-hidden border border-white/[0.08] p-0`}>
        <div className="hidden border-b border-white/[0.06] bg-white/[0.02] sm:grid sm:grid-cols-[minmax(0,1fr)_7rem_9rem_2.5rem] sm:gap-3 sm:px-5 sm:py-3.5">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Feature</p>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Free</p>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400/80">Premium Lite</p>
          <span className="sr-only">Expand</span>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-[calc(2.5rem+1.25rem)] top-0 hidden w-[9rem] sm:block"
          >
            <div className="bf-premium-compare-glow h-full w-full" />
          </div>

          {PREMIUM_COMPARISON_FEATURES.map((feature) => (
            <ComparisonRow
              key={feature.id}
              feature={feature}
              open={openId === feature.id}
              onToggle={() => setOpenId((current) => (current === feature.id ? null : feature.id))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
