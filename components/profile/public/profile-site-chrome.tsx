"use client";

import type { ReactNode } from "react";
import { CriedLogo } from "@/components/brand/logo";
import type { PageNavPosition } from "@/lib/types/settings";

export function ProfileSiteChrome({
  navPosition,
  siteNav,
  mainClassName = "",
  children,
}: {
  navPosition: PageNavPosition;
  siteNav: ReactNode | null;
  mainClassName?: string;
  children: ReactNode;
}) {
  const showNav = siteNav && navPosition !== "hidden";
  const hasTopNav = showNav && navPosition === "top";
  const hasBottomNav = showNav && navPosition === "bottom";
  const hasSideNav = showNav && (navPosition === "left" || navPosition === "right");

  const logo = (
    <a href="/" className="group inline-flex opacity-90 transition-opacity hover:opacity-100">
      <CriedLogo size={24} variant="muted" />
    </a>
  );

  const topBar = !hasSideNav ? (
    <header className="pointer-events-auto absolute inset-x-0 top-0 z-50 flex w-full flex-col items-stretch px-5 py-4 sm:px-8 sm:py-5">
      <div className="flex w-full items-center">{logo}</div>
      {hasTopNav ? (
        <div className="mt-4 flex justify-center">
          <div className="border-b border-white/[0.06]">{siteNav}</div>
        </div>
      ) : null}
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
    hasTopNav ? "pt-28 sm:pt-32" : "pt-20 sm:pt-24",
    hasBottomNav ? "pb-24 sm:pb-28" : "",
    navPosition === "left" ? "pl-[min(11rem,28vw)] sm:pl-44" : "",
    navPosition === "right" ? "pr-[min(11rem,28vw)] sm:pr-44" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {topBar}
      {sideRail}
      {bottomBar}
      <main className={`relative flex flex-1 items-center justify-center px-5 py-20 ${mainPadding} ${mainClassName}`.trim()}>
        {children}
      </main>
    </>
  );
}
