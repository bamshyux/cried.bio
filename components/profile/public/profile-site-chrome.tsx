"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { CriedLogo } from "@/components/brand/logo";
import type { PageNavPosition } from "@/lib/types/settings";

function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

function centerProfileInViewport(shell: HTMLElement, content: HTMLElement) {
  content.style.transform = "";
  content.style.willChange = "";

  const viewport = getViewportHeight();
  const contentHeight = Math.ceil(content.offsetHeight);

  if (contentHeight <= viewport) {
    const offsetY = (viewport - contentHeight) / 2;
    content.style.transform = `translateY(${offsetY}px)`;
    content.style.willChange = "transform";
    shell.scrollTop = 0;
    return;
  }

  shell.scrollTop = Math.max(0, (contentHeight - viewport) / 2);
}

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
  centerContent?: boolean;
  children: ReactNode;
}) {
  const showNav = siteNav && navPosition !== "hidden";
  const hasTopNav = showNav && navPosition === "top";
  const hasBottomNav = showNav && navPosition === "bottom";
  const hasSideNav = showNav && (navPosition === "left" || navPosition === "right");

  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  const horizontalPadding = [
    navPosition === "left" ? "pl-[min(11rem,28vw)] sm:pl-44" : "",
    navPosition === "right" ? "pr-[min(11rem,28vw)] sm:pr-44" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const flowPadding = [
    hasSideNav ? "pt-20 sm:pt-24" : "",
    hasBottomNav ? "pb-24 sm:pb-28" : "",
    horizontalPadding,
  ]
    .filter(Boolean)
    .join(" ");

  const edgePadding = centerContent ? horizontalPadding : flowPadding;

  const mainClass = centerContent
    ? "bf-profile-viewport-main--center"
    : "bf-profile-viewport-main--flow";

  useLayoutEffect(() => {
    if (!centerContent) return;

    const shell = shellRef.current;
    const content = contentRef.current;
    if (!shell || !content) return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const apply = () => {
      centerProfileInViewport(shell, content);
    };

    apply();
    requestAnimationFrame(() => {
      apply();
      requestAnimationFrame(apply);
    });

    const ro = new ResizeObserver(apply);
    ro.observe(content);

    const onViewportChange = () => apply();
    window.addEventListener("resize", onViewportChange);
    window.visualViewport?.addEventListener("resize", onViewportChange);
    window.addEventListener("load", onViewportChange);

    const delayed = window.setTimeout(apply, 250);
    const delayedAgain = window.setTimeout(apply, 900);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onViewportChange);
      window.visualViewport?.removeEventListener("resize", onViewportChange);
      window.removeEventListener("load", onViewportChange);
      window.clearTimeout(delayed);
      window.clearTimeout(delayedAgain);
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      content.style.transform = "";
      content.style.willChange = "";
    };
  }, [centerContent, children, edgePadding]);

  return (
    <>
      {fixedLogo}
      {sideRail}
      {bottomBar}
      <div ref={shellRef} className="bf-profile-viewport-shell">
        {topBar}
        <main className={`bf-profile-viewport-main ${mainClass} ${edgePadding} ${mainClassName}`.trim()}>
          <div ref={contentRef} className="bf-profile-viewport-content w-full">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
