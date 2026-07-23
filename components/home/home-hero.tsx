"use client";

import type { ReactNode } from "react";
import { HomeHeroShowcase } from "@/components/home/home-hero-showcase";
import { HomeScrollIndicator } from "@/components/home/home-scroll-indicator";
import type { LandingShowcaseProfile } from "@/lib/types/landing";

export function HomeHero({
  profiles,
  children,
}: {
  profiles: LandingShowcaseProfile[];
  children: ReactNode;
}) {
  return (
    <section className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col items-center justify-center px-6 pb-32 pt-28 sm:pt-32">
      <div
        aria-hidden
        className="bf-home-hero-spotlight pointer-events-none absolute left-1/2 top-[28%] h-[min(50vw,420px)] w-[min(90vw,720px)] -translate-x-1/2"
      />

      <div className="relative z-10 w-full max-w-[40rem] text-center">{children}</div>

      <div className="relative z-10 mt-20 w-full sm:mt-24 md:mt-28">
        <HomeHeroShowcase profiles={profiles} />
      </div>

      <HomeScrollIndicator />
    </section>
  );
}
