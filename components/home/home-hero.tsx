"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
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
  const sectionRef = useRef<HTMLElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto min-h-[min(100svh,960px)] max-w-6xl px-6 pb-36 pt-12 sm:min-h-[min(100svh,1000px)] sm:pt-16"
      onMouseMove={(event) => {
        const rect = sectionRef.current?.getBoundingClientRect();
        if (!rect) return;
        setParallax({
          x: (event.clientX - rect.left) / rect.width - 0.5,
          y: (event.clientY - rect.top) / rect.height - 0.5,
        });
      }}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
    >
      <div
        aria-hidden
        className="bf-home-hero-spotlight pointer-events-none absolute left-1/2 top-[16%] h-[min(56vw,460px)] w-[min(94vw,780px)] -translate-x-1/2 rounded-full"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_42%,transparent_30%,rgba(9,9,9,0.35)_100%)]"
      />

      <HomeHeroShowcase profiles={profiles} parallax={parallax} />

      <div className="relative z-20 mx-auto flex max-w-[42rem] flex-col items-center text-center">
        {children}
      </div>

      <HomeScrollIndicator />
    </section>
  );
}
