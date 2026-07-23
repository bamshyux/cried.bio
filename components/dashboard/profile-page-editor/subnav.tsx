"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const EDITOR_LINKS = [
  { href: "identity", label: "Identity" },
  { href: "customize", label: "Customize" },
  { href: "background", label: "Background" },
  { href: "links", label: "Links" },
  { href: "music", label: "Music" },
  { href: "themes", label: "Layouts" },
  { href: "effects", label: "Effects" },
] as const;

export function ProfilePageEditorSubnav({ pageId }: { pageId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/profile-pages/${pageId}`;

  return (
    <div className="bf-card overflow-x-auto p-2">
      <nav className="flex min-w-max gap-1">
        {EDITOR_LINKS.map((link) => {
          const href = `${base}/${link.href}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={link.href}
              href={href}
              className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-neutral-400 hover:bg-white/[0.05] hover:text-white"
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
