import Link from "next/link";
import type { DashboardSection } from "@/lib/dashboard/navigation";

export function SectionHub({
  section,
}: {
  section: DashboardSection;
}) {
  return (
    <div className="space-y-10">
      <div className="bf-dash-page-header">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">{section.label}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{section.label}</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-500">{section.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {section.items.map((item) => {
          const Icon = item.Icon ?? section.Icon;
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="bf-dash-hub-card group flex items-start gap-5 rounded-2xl border border-white/[0.06] bg-[#111] p-6 transition-all hover:border-white/[0.12] hover:bg-[#161616]"
            >
              <span className="inline-flex shrink-0 rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-3.5 text-neutral-400 transition-colors group-hover:border-white/10 group-hover:text-white">
                <Icon size={22} />
              </span>
              <span className="min-w-0">
                <p className="text-base font-medium text-white">{item.label}</p>
                {item.description ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{item.description}</p>
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
