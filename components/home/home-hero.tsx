"use client";

import type { ReactNode } from "react";
import { HomeHeroBackdrop } from "@/components/home/home-hero-backdrop";
import { HomeHeroShowcase } from "@/components/home/home-hero-showcase";
import { HomeProfileMarquee } from "@/components/home/home-profile-marquee";
import { HomeScrollIndicator } from "@/components/home/home-scroll-indicator";
import type { LandingShowcaseProfile } from "@/lib/types/landing";

export function HomeHero({
  profiles,
  marqueeProfiles,
  children,
}: {
  profiles: LandingShowcaseProfile[];
  marqueeProfiles: LandingShowcaseProfile[];
  children: ReactNode;
}) {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-10 pt-2 sm:pb-12 lg:pb-14 lg:pt-4">
      <HomeHeroBackdrop />

      <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:gap-8 xl:gap-10">
        <div className="bf-home-hero-copy order-2 text-left lg:order-1">{children}</div>

        <div className="relative order-1 w-full lg:order-2 lg:min-h-[min(calc(100svh-7rem),34rem)] lg:py-2">
          <HomeHeroShowcase profiles={profiles} variant="split" />
        </div>
      </div>

      <div className="relative z-10">
        <HomeProfileMarquee profiles={marqueeProfiles} />
      </div>

      <HomeScrollIndicator />
    </section>
  );
}
