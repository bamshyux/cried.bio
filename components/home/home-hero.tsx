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
    <section className="relative mx-auto min-h-[100svh] max-w-6xl px-6 pb-28 pt-28 sm:pt-32">
      <HomeHeroBackdrop />

      <div className="relative z-10 w-full max-w-[40rem] mx-auto text-center">{children}</div>

      <div className="relative z-10 mx-auto mt-14 w-full sm:mt-16">
        <HomeHeroShowcase profiles={profiles} />
      </div>

      <div className="relative z-10">
        <HomeProfileMarquee profiles={marqueeProfiles} />
      </div>

      <HomeScrollIndicator />
    </section>
  );
}
