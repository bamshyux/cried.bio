"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
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
} from "@/lib/dashboard/tour-steps";

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const TOOLTIP_WIDTH = 400;
const VIEWPORT_PAD = 16;
const TOOLTIP_GAP = 16;
const SCROLL_SETTLE_MS = 480;

function tooltipRect(top: number, left: number, height: number) {
  return { top, left, width: TOOLTIP_WIDTH, height };
}

function overlapsSpotlight(
  tooltip: { top: number; left: number; width: number; height: number },
  spotlight: SpotlightRect,
  gap = TOOLTIP_GAP,
): boolean {
  return !(
    tooltip.left + tooltip.width + gap <= spotlight.left ||
    spotlight.left + spotlight.width + gap <= tooltip.left ||
    tooltip.top + tooltip.height + gap <= spotlight.top ||
    spotlight.top + spotlight.height + gap <= tooltip.top
  );
}

function spotlightAfterScroll(spotlight: SpotlightRect, scrollDelta: number): SpotlightRect {
  return {
    ...spotlight,
    top: spotlight.top - scrollDelta,
  };
}

function alignedTooltipLeft(spotlight: SpotlightRect, viewportWidth: number): number {
  return clampTooltipLeft(
    spotlight.left + Math.max(0, (spotlight.width - TOOLTIP_WIDTH) / 2),
    viewportWidth,
  );
}

function resolveTooltipPosition(
  spotlight: SpotlightRect,
  viewport: { width: number; height: number },
  tooltipHeight: number,
): { top: number; left: number } {
  const gap = TOOLTIP_GAP;
  const alignedLeft = alignedTooltipLeft(spotlight, viewport.width);

  const candidates = [
    { top: spotlight.top + spotlight.height + gap, left: alignedLeft },
    { top: spotlight.top - tooltipHeight - gap, left: alignedLeft },
    {
      top: clampTooltipTop(spotlight.top, viewport.height, tooltipHeight),
      left: spotlight.left + spotlight.width + gap,
    },
    {
      top: clampTooltipTop(spotlight.top, viewport.height, tooltipHeight),
      left: spotlight.left - TOOLTIP_WIDTH - gap,
    },
    { top: viewport.height - tooltipHeight - VIEWPORT_PAD, left: viewport.width - TOOLTIP_WIDTH - VIEWPORT_PAD },
    { top: viewport.height - tooltipHeight - VIEWPORT_PAD, left: VIEWPORT_PAD },
    { top: VIEWPORT_PAD, left: viewport.width - TOOLTIP_WIDTH - VIEWPORT_PAD },
    { top: VIEWPORT_PAD, left: VIEWPORT_PAD },
  ];

  for (const candidate of candidates) {
    const top = clampTooltipTop(candidate.top, viewport.height, tooltipHeight);
    const left = clampTooltipLeft(candidate.left, viewport.width);
    const tooltip = tooltipRect(top, left, tooltipHeight);

    if (overlapsSpotlight(tooltip, spotlight, gap)) continue;
    if (top < VIEWPORT_PAD - 1 || top + tooltipHeight > viewport.height - VIEWPORT_PAD + 1) continue;
    if (left < VIEWPORT_PAD - 1 || left + TOOLTIP_WIDTH > viewport.width - VIEWPORT_PAD + 1) continue;

    return { top, left };
  }

  return {
    top: clampTooltipTop(spotlight.top + spotlight.height + gap, viewport.height, tooltipHeight),
    left: alignedLeft,
  };
}

function getTooltipMaxHeight(viewportHeight: number): number {
  return Math.min(viewportHeight * 0.78, 640);
}

function clampTooltipTop(top: number, viewportHeight: number, maxHeight: number): number {
  return Math.min(
    Math.max(VIEWPORT_PAD, top),
    Math.max(VIEWPORT_PAD, viewportHeight - maxHeight - VIEWPORT_PAD),
  );
}

function clampTooltipLeft(left: number, viewportWidth: number): number {
  return Math.min(
    Math.max(VIEWPORT_PAD, left),
    Math.max(VIEWPORT_PAD, viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PAD),
  );
}

function getSpotlightRectFromElement(element: HTMLElement): SpotlightRect | null {
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

function getSpotlightRect(target: string): SpotlightRect | null {
  const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!element) return null;
  return getSpotlightRectFromElement(element);
}

function computeTourScrollDelta(
  spotlight: SpotlightRect,
  viewport: { width: number; height: number },
  tooltipHeight: number,
): number {
  const gap = TOOLTIP_GAP;
  const current = resolveTooltipPosition(spotlight, viewport, tooltipHeight);
  if (!overlapsSpotlight(tooltipRect(current.top, current.left, tooltipHeight), spotlight, gap)) {
    return 0;
  }

  const scrollDown = Math.max(
    0,
    spotlight.top + spotlight.height + gap + tooltipHeight - (viewport.height - VIEWPORT_PAD),
  );
  const afterDown = spotlightAfterScroll(spotlight, scrollDown);
  const belowPos = resolveTooltipPosition(afterDown, viewport, tooltipHeight);
  if (!overlapsSpotlight(tooltipRect(belowPos.top, belowPos.left, tooltipHeight), afterDown, gap)) {
    return scrollDown;
  }

  const scrollUp = Math.min(0, VIEWPORT_PAD - (spotlight.top - tooltipHeight - gap));
  const afterUp = spotlightAfterScroll(spotlight, scrollUp);
  const abovePos = resolveTooltipPosition(afterUp, viewport, tooltipHeight);
  if (!overlapsSpotlight(tooltipRect(abovePos.top, abovePos.left, tooltipHeight), afterUp, gap)) {
    return scrollUp;
  }

  return scrollDown > 0 ? scrollDown : scrollUp;
}

function waitForScrollSettle(): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    window.addEventListener("scrollend", finish, { once: true });
    window.setTimeout(finish, SCROLL_SETTLE_MS);
  });
}

async function scrollTargetIntoTourView(
  target: string,
  viewport: { width: number; height: number },
  tooltipHeight: number,
  behavior: ScrollBehavior = "smooth",
): Promise<void> {
  const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!element) return;

  const spotlight = getSpotlightRectFromElement(element);
  if (!spotlight) return;

  const scrollDelta = computeTourScrollDelta(spotlight, viewport, tooltipHeight);

  if (Math.abs(scrollDelta) < 2) return;

  window.scrollBy({ top: scrollDelta, behavior });
  if (behavior === "smooth") {
    await waitForScrollSettle();
  }
}

async function scrollForTourStep(
  step: (typeof DASHBOARD_TOUR_STEPS)[number],
  viewport: { width: number; height: number },
  tooltipHeight: number,
): Promise<void> {
  if (step.target) {
    await scrollTargetIntoTourView(step.target, viewport, tooltipHeight, "smooth");
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  await waitForScrollSettle();
}

function lockBackgroundScroll(): () => void {
  const html = document.documentElement;
  const body = document.body;
  const previousHtmlOverflow = html.style.overflow;
  const previousBodyOverflow = body.style.overflow;

  html.style.overflow = "hidden";
  body.style.overflow = "hidden";

  const preventBackgroundScroll = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      event.preventDefault();
      return;
    }

    const tooltip = document.querySelector<HTMLElement>('[aria-label="Dashboard tour"]');
    if (tooltip?.contains(target)) return;

    event.preventDefault();
  };

  document.addEventListener("wheel", preventBackgroundScroll, { passive: false, capture: true });
  document.addEventListener("touchmove", preventBackgroundScroll, { passive: false, capture: true });

  const preventKeyboardScroll = (event: KeyboardEvent) => {
    const keys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
    if (!keys.has(event.key)) return;

    const target = event.target;
    if (target instanceof HTMLElement) {
      const tooltip = document.querySelector<HTMLElement>('[aria-label="Dashboard tour"]');
      if (tooltip?.contains(target)) return;
      if (target.isContentEditable) return;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
    }

    event.preventDefault();
  };

  document.addEventListener("keydown", preventKeyboardScroll, { capture: true });

  return () => {
    html.style.overflow = previousHtmlOverflow;
    body.style.overflow = previousBodyOverflow;
    document.removeEventListener("wheel", preventBackgroundScroll, true);
    document.removeEventListener("touchmove", preventBackgroundScroll, true);
    document.removeEventListener("keydown", preventKeyboardScroll, true);
  };
}

function getTooltipPosition(
  spotlight: SpotlightRect | null,
  viewport: { width: number; height: number },
  tooltipHeight: number,
): { top: number; left: number } {
  if (!spotlight) {
    return {
      top: clampTooltipTop(viewport.height / 2 - tooltipHeight / 2, viewport.height, tooltipHeight),
      left: clampTooltipLeft(viewport.width / 2 - TOOLTIP_WIDTH / 2, viewport.width),
    };
  }

  return resolveTooltipPosition(spotlight, viewport, tooltipHeight);
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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const fineTunedStepRef = useRef<number | null>(null);
  const [tooltipMeasuredHeight, setTooltipMeasuredHeight] = useState<number | null>(null);

  const step = DASHBOARD_TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex === DASHBOARD_TOUR_STEPS.length - 1;
  const tooltipMaxHeight = useMemo(
    () => (viewport.height > 0 ? getTooltipMaxHeight(viewport.height) : 640),
    [viewport.height],
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
    setTooltipMeasuredHeight(null);
  }, [stepIndex]);

  useLayoutEffect(() => {
    if (!visible || !tooltipRef.current) return;
    const height = tooltipRef.current.getBoundingClientRect().height;
    if (height > 0) {
      setTooltipMeasuredHeight(height);
    }
  }, [visible, stepIndex, step, spotlight, tourError]);

  useEffect(() => {
    if (!visible) return;
    return lockBackgroundScroll();
  }, [visible]);

  useEffect(() => {
    if (!visible || !step) return;

    const onPath = tourPathMatches(pathname, step.href);
    setNavReady(onPath);

    if (!onPath) {
      router.push(step.href);
    }
  }, [visible, step, pathname, router]);

  useEffect(() => {
    if (!visible || !mounted || !step || !navReady || viewport.width === 0 || viewport.height === 0) return;

    let cancelled = false;
    let attempts = 0;
    fineTunedStepRef.current = null;

    const focusTarget = async () => {
      if (cancelled) return;

      if (!step.target) {
        await scrollForTourStep(step, viewport, tooltipMaxHeight);
        if (!cancelled) setSpotlight(null);
        return;
      }

      const element = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (element) {
        await scrollForTourStep(step, viewport, tooltipMaxHeight);
        if (!cancelled) setSpotlight(getSpotlightRect(step.target));
        return;
      }

      if (attempts < 40) {
        attempts += 1;
        window.setTimeout(() => {
          void focusTarget();
        }, 100);
        return;
      }

      setSpotlight(null);
    };

    void focusTarget();

    const handleLayoutChange = () => updateSpotlight();
    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, true);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("scroll", handleLayoutChange, true);
    };
  }, [visible, mounted, stepIndex, step, navReady, updateSpotlight, viewport, tooltipMaxHeight]);

  useEffect(() => {
    if (!visible || !step?.target || !spotlight || viewport.height === 0) return;
    if (fineTunedStepRef.current === stepIndex) return;

    const tooltipHeight = tooltipMeasuredHeight ?? tooltipMaxHeight;
    const scrollDelta = computeTourScrollDelta(spotlight, viewport, tooltipHeight);

    if (Math.abs(scrollDelta) <= 4) {
      fineTunedStepRef.current = stepIndex;
      return;
    }

    if (tooltipMeasuredHeight == null) return;

    fineTunedStepRef.current = stepIndex;

    void scrollTargetIntoTourView(step.target, viewport, tooltipHeight, "auto").then(() => {
      updateSpotlight();
    });
  }, [visible, step?.target, spotlight, stepIndex, viewport, tooltipMaxHeight, tooltipMeasuredHeight, updateSpotlight]);

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

  const tooltipHeightForLayout = tooltipMeasuredHeight ?? tooltipMaxHeight;
  const tooltipPosition = getTooltipPosition(spotlight, viewport, tooltipHeightForLayout);
  const progress = ((stepIndex + 1) / DASHBOARD_TOUR_STEPS.length) * 100;

  const tourOverlay = (
    <div className="fixed inset-0 z-[110] touch-none overflow-hidden overscroll-none">
      {spotlight ? <TourOverlay spotlight={spotlight} /> : (
        <div className="absolute inset-0 bg-black/78" aria-hidden />
      )}

      <div
        ref={tooltipRef}
        className={`${cardClassName} fixed z-[111] flex w-[min(100vw-2rem,25rem)] touch-auto flex-col border border-white/[0.1] shadow-2xl`}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          maxHeight: tooltipMaxHeight,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Dashboard tour"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
        </div>

        <div className="mt-4 shrink-0 border-t border-white/[0.06] bg-[#111] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
    </div>
  );

  return createPortal(tourOverlay, document.body);
}

export { DASHBOARD_TOUR_STEPS };
