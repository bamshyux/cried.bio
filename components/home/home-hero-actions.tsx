import Link from "next/link";
import type { ReactNode } from "react";

export function HomeHeroActions({ children }: { children: ReactNode }) {
  return (
    <div className="bf-home-enter bf-home-enter-4 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
      {children}
    </div>
  );
}

export function HomePrimaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="bf-home-cta-primary inline-flex items-center gap-2 rounded-lg bg-[#fafafa] px-8 py-3 text-sm font-semibold text-[#090909] transition-colors hover:bg-[#e5e5e5]"
    >
      {children}
    </Link>
  );
}

export function HomeSecondaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#141414] px-8 py-3 text-sm font-semibold text-white transition-colors hover:border-white/[0.14] hover:bg-[#1a1a1a]"
    >
      {children}
    </Link>
  );
}
