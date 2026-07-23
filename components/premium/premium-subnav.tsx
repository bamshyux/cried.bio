"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";

const LINKS = [
  { href: "/dashboard/premium/plans", label: "Plans" },
  { href: "/dashboard/premium/store", label: "Store" },
];

export function PremiumSubnav() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const activeIndex = LINKS.findIndex(
    (link) =>
      pathname === link.href ||
      (link.href === "/dashboard/premium/plans" && pathname === "/dashboard/premium"),
  );

  useLayoutEffect(() => {
    const index = activeIndex >= 0 ? activeIndex : 0;
    const link = linkRefs.current[index];
    const container = containerRef.current;
    if (!link || !container) return;

    const containerRect = container.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    setIndicator({
      left: linkRect.left - containerRect.left,
      width: linkRect.width,
    });
  }, [activeIndex, pathname]);

  return (
    <div className="mb-7 flex justify-center">
      <div
        ref={containerRef}
        className="relative inline-flex rounded-xl border border-white/[0.08] bg-[#0c0c0c]/80 p-1 shadow-[0_8px_32px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)]"
      >
        <span
          className="bf-premium-segment-indicator pointer-events-none absolute bottom-1 top-1 rounded-lg bg-white/[0.07] shadow-[inset_0_0_0_1px_rgba(201,184,150,0.12),0_4px_16px_rgba(0,0,0,0.25)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ left: indicator.left, width: indicator.width }}
        />

        {LINKS.map((link, index) => {
          const active = index === (activeIndex >= 0 ? activeIndex : 0);
          return (
            <Link
              key={link.href}
              ref={(node) => {
                linkRefs.current[index] = node;
              }}
              href={link.href}
              className={`relative z-10 min-w-[5.5rem] px-5 py-2 text-center text-sm font-medium transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                active ? "text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
