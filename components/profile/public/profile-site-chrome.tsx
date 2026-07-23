"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CriedLogo } from "@/components/brand/logo";
import type { PageNavPosition } from "@/lib/types/settings";

export function ProfileSiteChrome({
  navPosition,
  siteNav,
  mainClassName = "",
  centerContent = true,
  children,
}: {
  navPosition: PageNavPosition;
  siteNav: ReactNode | null;
  mainClassName?: string;
  /** Vertically center short profile content in the viewport area below the header. */
  centerContent?: boolean;
  children: ReactNode;
}) {
  const showNav = siteNav && navPosition !== "hidden";
  const hasTopNav = showNav && navPosition === "top";
  const hasBottomNav = showNav && navPosition === "bottom";
  const hasSideNav = showNav && (navPosition === "left" || navPosition === "right");

  const mainRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [viewportLayout, setViewportLayout] = useState<{
    fits: boolean;
    height: number;
  } | null>(null);

  const logo = (
    <a href="/" className="group inline-flex opacity-90 transition-opacity hover:opacity-100">
      <CriedLogo size={24} variant="muted" />
    </a>
  );

  const fixedLogo = !hasSideNav ? (
    <div className="pointer-events-auto fixed top-0 left-0 z-50 px-5 py-4 sm:px-8 sm:py-5">{logo}</div>
  ) : null;

  const topBar = !hasSideNav && hasTopNav ? (
    <header className="pointer-events-auto absolute inset-x-0 top-0 z-40 flex flex-col items-stretch px-5 py-4 sm:px-8 sm:py-5">
      <div className="flex justify-center">
        <div className="border-b border-white/[0.06]">{siteNav}</div>
      </div>
    </header>
  ) : null;

  const bottomBar = hasBottomNav ? (
    <footer className="pointer-events-auto fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 py-3 sm:px-6">
      {siteNav}
    </footer>
  ) : null;

  const sideRail = hasSideNav ? (
    <aside
      className={`pointer-events-auto fixed top-0 z-40 flex h-full w-[min(11rem,28vw)] flex-col border-white/[0.06] bg-black/30 px-3 py-5 backdrop-blur-md sm:w-44 sm:px-4 sm:py-6 ${
        navPosition === "left" ? "left-0 border-r" : "right-0 border-l"
      }`}
    >
      <div className="mb-6 shrink-0">{logo}</div>
      <div className="min-h-0 flex-1 overflow-y-auto">{siteNav}</div>
    </aside>
  ) : null;

  const mainPadding = [
    hasSideNav ? "pt-20 sm:pt-24" : "",
    hasBottomNav ? "pb-24 sm:pb-28" : "",
    navPosition === "left" ? "pl-[min(11rem,28vw)] sm:pl-44" : "",
    navPosition === "right" ? "pr-[min(11rem,28vw)] sm:pr-44" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const flowSpacingClass = centerContent
    ? ""
    : `py-10 sm:py-12 ${hasTopNav ? "pt-24 sm:pt-28" : ""}`.trim();

  const centered = centerContent && viewportLayout?.fits === true;

  useLayoutEffect(() => {
    if (!centerContent) return;

    const measure = () => {
      const main = mainRef.current;
      const content = contentRef.current;
      if (!main || !content) return;

      const top = main.getBoundingClientRect().top;
      const available = Math.max(0, window.innerHeight - top);
      const bottomReserve = hasBottomNav ? 112 : 0;
      const contentHeight = content.scrollHeight + bottomReserve;
      const fits = contentHeight <= available + 1;

      setViewportLayout((prev) => {
        if (prev?.fits === fits && prev?.height === available) return prev;
        return { fits, height: available };
      });
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(content);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [centerContent, children, hasBottomNav, mainPadding]);

  useEffect(() => {
    if (!centered) return;

    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [centered]);

  const mainLayoutClass = !centerContent
    ? "flex min-h-[100dvh] w-full flex-col"
    : centered
      ? "flex w-full items-center justify-center overflow-hidden"
      : "flex w-full flex-col";

  const mainSpacingClass = !centerContent
    ? `px-5 ${flowSpacingClass}`.trim()
    : centered
      ? "px-5"
      : `px-5 py-10 sm:py-12 ${hasTopNav ? "pt-24 sm:pt-28" : ""}`.trim();

  const mainStyle =
    centered && viewportLayout
      ? { height: viewportLayout.height, maxHeight: viewportLayout.height }
      : undefined;

  return (
    <div className="relative flex flex-1 flex-col">
      {fixedLogo}
      {topBar}
      {sideRail}
      {bottomBar}
      <main
        ref={mainRef}
        style={mainStyle}
        className={`relative ${mainLayoutClass} ${mainSpacingClass} ${mainPadding} ${mainClassName}`.trim()}
      >
        <div ref={contentRef} className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
