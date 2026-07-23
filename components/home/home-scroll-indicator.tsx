"use client";

export function HomeScrollIndicator() {
  return (
    <a
      href="#stats"
      aria-label="Scroll to explore"
      className="bf-home-scroll-cue group absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 text-neutral-600 transition-colors hover:text-neutral-400"
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        Explore
      </span>
      <div className="flex h-9 w-5 items-start justify-center rounded-full border border-white/[0.12] bg-white/[0.02] pt-1.5 backdrop-blur-sm">
        <span className="bf-home-scroll-dot h-1 w-1 rounded-full bg-white/50" />
      </div>
    </a>
  );
}
