"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard/premium/plans", label: "Plans" },
  { href: "/dashboard/premium/store", label: "Store" },
];

export function PremiumSubnav() {
  const pathname = usePathname();

  return (
    <div className="bf-card mb-6 overflow-x-auto p-1.5">
      <nav className="flex min-w-max gap-1">
        {LINKS.map((link) => {
          const active =
            pathname === link.href ||
            (link.href === "/dashboard/premium/plans" && pathname === "/dashboard/premium");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                active
                  ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                  : "text-neutral-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
