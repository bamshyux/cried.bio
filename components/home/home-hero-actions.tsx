import Link from "next/link";
import type { ReactNode } from "react";

export function HomeHeroActions({ children }: { children: ReactNode }) {
  return (
    <div className="bf-home-enter bf-home-enter-4 mt-12 flex flex-col items-center justify-center gap-3 sm:mt-14 sm:flex-row">
      {children}
    </div>
  );
}

export function HomePrimaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="bf-home-cta-primary group inline-flex min-w-[11rem] items-center justify-center gap-2 rounded-xl bg-[#fafafa] px-8 py-3.5 text-sm font-semibold text-[#090909] shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_12px_40px_rgba(255,255,255,0.08)] transition-all duration-500 bf-home-ease hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_20px_56px_rgba(255,255,255,0.14)] active:translate-y-0"
    >
      {children}
      <svg
        className="h-4 w-4 transition-transform duration-500 bf-home-ease group-hover:translate-x-0.5"
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
      className="inline-flex min-w-[11rem] items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.03] px-8 py-3.5 text-sm font-semibold text-neutral-200 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-all duration-500 bf-home-ease hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] active:translate-y-0"
    >
      {children}
    </Link>
  );
}
