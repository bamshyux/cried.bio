import Link from "next/link";
import type { ReactNode } from "react";

export function HomeHeroActions({ children }: { children: ReactNode }) {
  return (
    <div className="bf-home-enter bf-home-enter-4 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
      {children}
    </div>
  );
}

export function HomePrimaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="bf-home-cta-primary group inline-flex items-center gap-2.5 rounded-xl bg-[#fafafa] px-9 py-4 text-sm font-semibold text-[#090909] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_16px_48px_rgba(255,255,255,0.1)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_20px_56px_rgba(255,255,255,0.14)] active:translate-y-0 active:scale-100"
    >
      {children}
      <svg
        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
      </svg>
    </Link>
  );
}

export function HomeSecondaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-[#141414]/70 px-9 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.2] hover:bg-[#1a1a1a]/90 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] active:translate-y-0"
    >
      {children}
    </Link>
  );
}
