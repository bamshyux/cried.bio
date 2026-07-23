"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { HomeFloatingCards } from "@/components/home/home-floating-cards";
import type { LandingProfile } from "@/lib/types/landing";

export function HomeHeroShell({
  children,
  floatingProfiles,
}: {
  children: ReactNode;
  floatingProfiles: LandingProfile[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24 lg:pb-28 lg:pt-28"
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
      <HomeFloatingCards profiles={floatingProfiles} parallax={parallax} />
      {children}
    </section>
  );
}
