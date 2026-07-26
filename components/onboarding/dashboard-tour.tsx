"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { completeDashboardTourAction } from "@/app/actions/onboarding";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  cardClassName,
} from "@/components/dashboard/form-fields";
import {
  DASHBOARD_TOUR_STEPS,
  tourPathMatches,
  type DashboardTourStep,
} from "@/lib/dashboard/tour-steps";

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const TOOLTIP_WIDTH = 400;
const VIEWPORT_PAD = 16;

function getSpotlightRect(target: string): SpotlightRect | null {
  const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;

  const padding = 8;
  return {
    top: Math.max(VIEWPORT_PAD, rect.top - padding),
    left: Math.max(VIEWPORT_PAD, rect.left - padding),
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

function estimateTooltipHeight(step: DashboardTourStep): number {
  return 196 + step.bullets.length * 26;
}

function getTooltipPosition(
  spotlight: SpotlightRect | null,
  viewport: { width: number; height: number },
  tooltipHeight: number,
): { top: number; left: number } {
  if (!spotlight) {
    return {
      top: Math.max(VIEWPORT_PAD, viewport.height / 2 - tooltipHeight / 2),
      left: Math.max(VIEWPORT_PAD, viewport.width / 2 - TOOLTIP_WIDTH / 2),
    };
  }

  const sidebarTarget = spotlight.left < 320;
  const spaceBelow = viewport.height - (spotlight.top + spotlight.height);
  const spaceAbove = spotlight.top;
  const spaceRight = viewport.width - (spotlight.left + spotlight.width);

  if (sidebarTarget && spaceRight >= TOOLTIP_WIDTH + 24) {
    return {
      top: Math.min(
        Math.max(VIEWPORT_PAD, spotlight.top),
        viewport.height - tooltipHeight - VIEWPORT_PAD,
      ),
      left: Math.min(
        spotlight.left + spotlight.width + 20,
        viewport.width - TOOLTIP_WIDTH - VIEWPORT_PAD,
      ),
    };
  }

  if (spaceBelow >= tooltipHeight + 24) {
    return {
      top: spotlight.top + spotlight.height + 16,
      left: Math.min(
        Math.max(VIEWPORT_PAD, spotlight.left),
        viewport.width - TOOLTIP_WIDTH - VIEWPORT_PAD,
      ),
    };
  }

  if (spaceAbove >= tooltipHeight + 24) {
    return {
      top: spotlight.top - tooltipHeight - 16,
      left: Math.min(
        Math.max(VIEWPORT_PAD, spotlight.left),
        viewport.width - TOOLTIP_WIDTH - VIEWPORT_PAD,
      ),
    };
  }

  return {
    top: Math.max(VIEWPORT_PAD, viewport.height - tooltipHeight - VIEWPORT_PAD),
    left: Math.max(VIEWPORT_PAD, viewport.width / 2 - TOOLTIP_WIDTH / 2),
  };
}

function TourOverlay({ spotlight }: { spotlight: SpotlightRect }) {
  const bottom = spotlight.top + spotlight.height;
  const right = spotlight.left + spotlight.width;

  return (
    <>
      <div
        className="absolute left-0 right-0 top-0 bg-black/78"
        style={{ height: spotlight.top }}
        aria-hidden
      />
      <div
        className="absolute bottom-0 left-0 right-0 bg-black/78"
        style={{ top: bottom }}
        aria-hidden
      />
      <div
        className="absolute bg-black/78"
        style={{ top: spotlight.top, left: 0, width: spotlight.left, height: spotlight.height }}
        aria-hidden
      />
      <div
        className="absolute bg-black/78"
        style={{ top: spotlight.top, left: right, right: 0, height: spotlight.height }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute rounded-xl border-2 border-white/80 shadow-[0_0_32px_rgba(255,255,255,0.14)] transition-all duration-300 ease-out"
        style={{
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
        }}
        aria-hidden
      />
    </>
  );
}

export function DashboardTour({
  active,
  onFinished,
}: {
  active: boolean;
  onFinished?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [isPending, startTransition] = useTransition();
  const [visible, setVisible] = useState(active);
  const [mounted, setMounted] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [tourError, setTourError] = useState<string>();
  const [navReady, setNavReady] = useState(false);

  const step = DASHBOARD_TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex === DASHBOARD_TOUR_STEPS.length - 1;
  const tooltipHeight = useMemo(
    () => (step ? estimateTooltipHeight(step) : 220),
    [step],
  );

  const updateSpotlight = useCallback(() => {
    if (!visible || !step?.target) {
      setSpotlight(null);
      return;
    }
    setSpotlight(getSpotlightRect(step.target));
  }, [visible, step]);

  useEffect(() => {
    setMounted(true);
    const syncViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    setVisible(active);
    if (active) {
      setStepIndex(0);
      setTourError(undefined);
      setNavReady(false);
      router.push(DASHBOARD_TOUR_STEPS[0].href);
    }
  }, [active, router]);

  useEffect(() => {
    if (!visible || !step) return;

    const onPath = tourPathMatches(pathname, step.href);
    setNavReady(onPath);

    if (!onPath) {
      router.push(step.href);
    }
  }, [visible, step, pathname, router]);

  useEffect(() => {
    if (!visible || !mounted || !step || !navReady) return;

    let cancelled = false;
    let attempts = 0;

    const tryFocusTarget = () => {
      if (cancelled) return;

      if (!step.target) {
        setSpotlight(null);
        return;
      }

      const element = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (element) {
        element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        setSpotlight(getSpotlightRect(step.target));
        return;
      }

      if (attempts < 40) {
        attempts += 1;
        window.setTimeout(tryFocusTarget, 100);
        return;
      }

      setSpotlight(null);
    };

    tryFocusTarget();

    const handleLayoutChange = () => updateSpotlight();
    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, true);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("scroll", handleLayoutChange, true);
    };
  }, [visible, mounted, stepIndex, step, navReady, updateSpotlight]);

  const finishTour = () => {
    startTransition(async () => {
      const result = await completeDashboardTourAction();
      if (result.error) {
        setTourError(result.error);
        return;
      }
      setVisible(false);
      onFinished?.();
      router.refresh();
    });
  };

  const handleSkip = () => finishTour();
  const handleNext = () => {
    if (isLastStep) {
      finishTour();
      return;
    }
    setNavReady(false);
    setStepIndex((index) => index + 1);
  };
  const handleBack = () => {
    setNavReady(false);
    setStepIndex((index) => Math.max(0, index - 1));
  };

  if (!mounted || !visible || !step || viewport.width === 0) return null;

  const tooltipPosition = getTooltipPosition(spotlight, viewport, tooltipHeight);
  const progress = ((stepIndex + 1) / DASHBOARD_TOUR_STEPS.length) * 100;

  const tourOverlay = (
    <div className="fixed inset-0 z-[110]">
      {spotlight ? <TourOverlay spotlight={spotlight} /> : (
        <div className="absolute inset-0 bg-black/78" aria-hidden />
      )}

      <div
        className={`${cardClassName} absolute z-[111] w-[min(100vw-2rem,25rem)] max-h-[min(78vh,640px)] overflow-y-auto border border-white/[0.1] shadow-2xl`}
        style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
        role="dialog"
        aria-modal="true"
        aria-label="Dashboard tour"
      >
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-white/70 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
          {step.group} · Step {stepIndex + 1} of {DASHBOARD_TOUR_STEPS.length}
        </p>

        <div className="mt-3 flex items-start gap-3">
          <span className="text-2xl leading-none" aria-hidden>{step.emoji}</span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">{step.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{step.description}</p>
          </div>
        </div>

        {step.bullets.length > 0 ? (
          <ul className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
            {step.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2.5 text-sm leading-relaxed text-neutral-300">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-neutral-500" aria-hidden />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {tourError ? (
          <p className="mt-4 text-sm text-red-400">{tourError}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending}
            className="text-sm text-neutral-500 transition-colors hover:text-white"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 ? (
              <button type="button" onClick={handleBack} className={buttonSecondaryClassName}>
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleNext}
              disabled={isPending}
              className={buttonPrimaryClassName}
            >
              {isPending ? "Saving..." : isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(tourOverlay, document.body);
}

export { DASHBOARD_TOUR_STEPS };
