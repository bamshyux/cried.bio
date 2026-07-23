import Link from "next/link";
import type { ReactNode } from "react";

export function HomeHeroActions({ children }: { children: ReactNode }) {
  return (
    <div className="bf-home-enter bf-home-enter-4 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
      {children}
    </div>
  );
}

export function HomePrimaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="bf-home-cta-primary group inline-flex items-center gap-2 rounded-xl bg-[#fafafa] px-8 py-3.5 text-sm font-semibold text-[#090909] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_12px_40px_rgba(255,255,255,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_16px_48px_rgba(255,255,255,0.12)] active:translate-y-0"
    >
      {children}
    </Link>
  );
}

export function HomeSecondaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#141414]/80 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-[#1a1a1a] active:translate-y-0"
    >
      {children}
    </Link>
  );
}
