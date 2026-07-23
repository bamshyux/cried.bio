"use client";

import type { ReactNode } from "react";
import { LuChartBar, LuMessageSquare, LuMusic, LuShare2 } from "react-icons/lu";

function FloatCard({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`pointer-events-none absolute hidden select-none rounded-xl border border-white/[0.08] bg-[#0c0c0c]/55 px-3 py-2.5 shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:block ${className}`}
    >
      {children}
    </div>
  );
}

export function HomeHeroFloatingUi() {
  return (
    <>
      <FloatCard className="bf-home-float-ui-a left-[2%] top-[8%] max-w-[11rem] opacity-45 blur-[0.3px] xl:left-[4%]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-neutral-300">
            <LuMusic className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-white/90">Now playing</p>
            <p className="truncate text-[10px] text-neutral-500">Playlist · 10 tracks</p>
          </div>
        </div>
      </FloatCard>

      <FloatCard className="bf-home-float-ui-b right-[2%] top-[10%] max-w-[10.5rem] opacity-40 blur-[0.4px] xl:right-[5%]">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#5865F2]/25 text-[10px] font-bold text-[#aeb4ff]">
            D
          </span>
          <div>
            <p className="text-[11px] font-medium text-white/85">Discord</p>
            <p className="text-[10px] text-emerald-400/80">Online</p>
          </div>
        </div>
      </FloatCard>

      <FloatCard className="bf-home-float-ui-c left-[0%] top-[44%] max-w-[9.5rem] opacity-35 blur-[0.5px] xl:left-[2%]">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1DB954]/20 text-[9px] font-bold text-[#6ee7a0]">
            S
          </span>
          <p className="text-[11px] text-neutral-400">Spotify embed</p>
        </div>
      </FloatCard>

      <FloatCard className="bf-home-float-ui-d right-[0%] top-[42%] max-w-[10rem] opacity-38 blur-[0.4px] xl:right-[3%]">
        <div className="flex items-center gap-2 text-neutral-400">
          <LuShare2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <div className="space-y-1">
            <div className="h-1.5 w-14 rounded-full bg-white/15" />
            <div className="h-1.5 w-10 rounded-full bg-white/10" />
          </div>
        </div>
      </FloatCard>

      <FloatCard className="bf-home-float-ui-e bottom-[16%] left-[6%] max-w-[10rem] opacity-36 blur-[0.5px] xl:left-[8%]">
        <div className="flex items-center gap-2">
          <LuMessageSquare className="h-3.5 w-3.5 text-neutral-500" aria-hidden />
          <p className="text-[11px] text-neutral-500">Guestbook · 12</p>
        </div>
      </FloatCard>

      <FloatCard className="bf-home-float-ui-f bottom-[14%] right-[6%] max-w-[9rem] opacity-40 blur-[0.35px] xl:right-[9%]">
        <div className="flex items-center gap-2">
          <LuChartBar className="h-3.5 w-3.5 text-neutral-500" aria-hidden />
          <p className="text-[11px] text-neutral-500">2.4k views</p>
        </div>
      </FloatCard>
    </>
  );
}
