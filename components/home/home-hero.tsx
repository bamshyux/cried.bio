"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { HomeHeroShowcase } from "@/components/home/home-hero-showcase";
import { HomeScrollIndicator } from "@/components/home/home-scroll-indicator";
import type { LandingProfile } from "@/lib/types/landing";

export function HomeHero({
  profiles,
  children,
}: {
  profiles: LandingProfile[];
  children: ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto min-h-[min(100svh,940px)] max-w-6xl px-6 pb-32 pt-14 sm:min-h-[min(100svh,980px)] sm:pt-20"
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
        className="bf-home-hero-spotlight pointer-events-none absolute left-1/2 top-[18%] h-[min(52vw,420px)] w-[min(92vw,720px)] -translate-x-1/2 rounded-full"
      />

      <HomeHeroShowcase profiles={profiles} parallax={parallax} />

      <div className="relative z-20 mx-auto flex max-w-[40rem] flex-col items-center text-center">
        {children}
      </div>

      <HomeScrollIndicator />
    </section>
  );
}
