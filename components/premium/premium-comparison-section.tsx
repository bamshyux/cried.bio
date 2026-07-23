"use client";

import { useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import {
  PREMIUM_COMPARISON_FEATURES,
  type FeatureAvailability,
  type PremiumComparisonFeature,
} from "@/lib/premium/comparison-features";
import { PremiumFeaturePreviewVisual } from "@/components/premium/premium-feature-preview";
import {
  PremiumExcludedIcon,
  PremiumFeatureIcon,
  PremiumIncludedIcon,
  PremiumPartialIcon,
} from "@/components/premium/premium-icons";
import { cardClassName } from "@/components/dashboard/form-fields";

function AvailabilityCell({
  value,
  variant = "default",
}: {
  value: FeatureAvailability;
  variant?: "default" | "premium";
}) {
  if (value.kind === "included") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#c9b896]">
        <PremiumIncludedIcon className="h-3.5 w-3.5 shrink-0" />
        <span className={variant === "premium" ? "text-[#d4c4a8]" : undefined}>Included</span>
      </span>
    );
  }

  if (value.kind === "excluded") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-neutral-500">
        <PremiumExcludedIcon className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
        Not included
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-neutral-400">
      <PremiumPartialIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
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
    <div className="border-b border-white/[0.05] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="bf-premium-compare-row group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-5 text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:grid-cols-[minmax(0,1fr)_7.5rem_10rem_2.75rem] sm:gap-4 sm:px-6 sm:py-6"
      >
        <span className="flex min-w-0 items-center gap-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-[#c9b896]/90 transition-colors duration-300 group-hover:border-[rgba(201,184,150,0.18)] group-hover:bg-[rgba(201,184,150,0.06)]">
            <PremiumFeatureIcon type={feature.preview} className="h-[17px] w-[17px]" />
          </span>
          <span className="text-[15px] font-medium tracking-tight text-white sm:text-base">
            {feature.name}
          </span>
        </span>

        <span className="hidden sm:block">
          <AvailabilityCell value={feature.free} />
        </span>

        <span className="bf-premium-compare-premium-cell relative z-[1] -my-6 hidden py-6 sm:block">
          <AvailabilityCell value={feature.premium} variant="premium" />
        </span>

        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center justify-self-end rounded-lg border border-white/[0.08] bg-white/[0.02] text-neutral-500 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:border-white/[0.12] group-hover:bg-white/[0.05] group-hover:text-neutral-300 sm:justify-self-center ${
            open ? "rotate-180 border-[rgba(201,184,150,0.2)] bg-[rgba(201,184,150,0.08)] text-[#d4c4a8]" : ""
          }`}
          aria-hidden
        >
          <LuChevronDown className="h-4 w-4" strokeWidth={2} />
        </span>
      </button>

      <div
        className={`bf-premium-compare-expand grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-5 pt-1 sm:px-6 sm:pb-6">
            <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.22)] sm:p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9b896]/75">
                      About this feature
                    </p>
                    <p className="mt-3 text-sm leading-[1.75] text-neutral-400 sm:text-[15px]">
                      {feature.description}
                    </p>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                  <div className="flex flex-wrap gap-6 sm:hidden">
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
                        Free
                      </p>
                      <AvailabilityCell value={feature.free} />
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c9b896]/70">
                        Premium Lite
                      </p>
                      <AvailabilityCell value={feature.premium} variant="premium" />
                    </div>
                  </div>
                </div>

                <div className="shrink-0 lg:w-[15rem]">
                  <PremiumFeaturePreviewVisual type={feature.preview} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PremiumComparisonSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="pt-2">
      <div className="mb-7 text-center sm:mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9b896]/70">
          Compare plans
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
          Everything you unlock with Premium
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-neutral-500 sm:text-[15px]">
          See exactly what&apos;s included with Premium Lite and why it&apos;s worth upgrading.
        </p>
      </div>

      <div
        className={`${cardClassName} overflow-hidden border border-white/[0.07] p-0 shadow-[0_16px_48px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)]`}
      >
        <div className="hidden border-b border-white/[0.06] bg-white/[0.015] sm:grid sm:grid-cols-[minmax(0,1fr)_7.5rem_10rem_2.75rem] sm:gap-4 sm:px-6 sm:py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Feature</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Free</p>
          <p className="bf-premium-compare-premium-cell relative z-[1] -my-4 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c9b896]/85">
            Premium Lite
          </p>
          <span className="sr-only">Expand</span>
        </div>

        <div className="relative">
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
