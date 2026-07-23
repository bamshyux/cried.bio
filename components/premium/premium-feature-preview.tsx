import type { PremiumFeaturePreview } from "@/lib/premium/comparison-features";
import { PremiumPlayIcon } from "@/components/premium/premium-icons";
import { LuAward } from "react-icons/lu";

export function PremiumFeaturePreviewVisual({ type }: { type: PremiumFeaturePreview }) {
  return (
    <div className="bf-premium-preview relative aspect-[16/10] w-full min-w-[10rem] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:max-w-[15rem]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,184,150,0.08),transparent_58%)]" />

      {type === "music" ? (
        <div className="absolute inset-3 flex flex-col justify-end gap-2">
          <div className="flex h-9 items-end gap-0.5">
            {[4, 7, 5, 9, 6, 8, 5].map((h, i) => (
              <span
                key={i}
                className="bf-premium-preview-bar flex-1 rounded-full bg-[rgba(201,184,150,0.35)]"
                style={{ height: `${h * 3}px`, animationDelay: `${i * 0.08}s` }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/50 px-2.5 py-2 text-[10px] text-neutral-400">
            <PremiumPlayIcon className="h-3 w-3 text-[#c9b896]" />
            Playlist · 10 tracks
          </div>
        </div>
      ) : null}

      {type === "pages" ? (
        <div className="absolute inset-3 flex flex-col gap-2">
          <div className="flex gap-1">
            {["Home", "Gallery", "FAQ"].map((tab, i) => (
              <span
                key={tab}
                className={`rounded-full px-2 py-0.5 text-[9px] ${
                  i === 0
                    ? "bg-[rgba(201,184,150,0.12)] text-[#d4c4a8]"
                    : "border border-white/[0.08] text-neutral-500"
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
          <div className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] p-2">
            <div className="h-2 w-2/3 rounded bg-white/10" />
            <div className="mt-2 h-2 w-1/2 rounded bg-white/[0.06]" />
          </div>
        </div>
      ) : null}

      {type === "badge" ? (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(201,184,150,0.28)] bg-[rgba(201,184,150,0.08)] text-[#d4c4a8] shadow-[0_0_24px_rgba(201,184,150,0.12)]">
            <LuAward className="h-5 w-5" aria-hidden strokeWidth={1.75} />
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] text-neutral-300">
            Premium
          </span>
        </div>
      ) : null}

      {type === "fonts" ? (
        <div className="absolute inset-3 flex flex-col justify-center gap-2">
          <p className="font-serif text-lg text-white/90">Aa</p>
          <p className="text-sm font-light tracking-[0.2em] text-[#c9b896]/80">PREMIUM</p>
          <p className="text-xs text-neutral-500">Exclusive typefaces</p>
        </div>
      ) : null}

      {type === "effects" ? (
        <>
          <div className="bf-premium-preview-orbit absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(201,184,150,0.2)]" />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d4c4a8]/90 shadow-[0_0_16px_rgba(201,184,150,0.35)]" />
        </>
      ) : null}

      {type === "widgets" ? (
        <div className="absolute inset-3 grid grid-cols-2 gap-1.5">
          {["Discord", "Spotify", "GitHub", "Clock"].map((label) => (
            <div
              key={label}
              className="flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-[9px] text-neutral-400"
            >
              {label}
            </div>
          ))}
        </div>
      ) : null}

      {type === "schedules" ? (
        <div className="absolute inset-3 space-y-2">
          {["Mon 9:00 — Summer preset", "Fri 18:00 — Event preset"].map((row) => (
            <div
              key={row}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-[9px] text-neutral-400"
            >
              {row}
            </div>
          ))}
        </div>
      ) : null}

      {type === "customize" ? (
        <div className="absolute inset-3 flex gap-2">
          <div className="w-1/3 space-y-1">
            {["Layout", "Accent", "Domain"].map((label) => (
              <div
                key={label}
                className="rounded border border-white/[0.06] bg-white/[0.03] px-1.5 py-1 text-[8px] text-neutral-500"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="flex-1 rounded-lg border border-white/[0.08] bg-[#111] p-2">
            <div className="mx-auto h-5 w-5 rounded-full bg-[rgba(201,184,150,0.25)]" />
            <div className="mt-2 h-1.5 w-full rounded bg-white/10" />
          </div>
        </div>
      ) : null}

      {type === "analytics" ? (
        <div className="absolute inset-x-3 bottom-3 flex h-12 items-end gap-1">
          {[35, 55, 40, 70, 48, 62, 44].map((h, i) => (
            <span
              key={i}
              className="bf-premium-preview-bar flex-1 rounded-t bg-[rgba(201,184,150,0.32)]"
              style={{ height: `${h}%`, animationDelay: `${i * 0.07}s` }}
            />
          ))}
        </div>
      ) : null}

      {type === "early-access" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
          <span className="rounded-full border border-[rgba(201,184,150,0.22)] bg-[rgba(201,184,150,0.08)] px-2.5 py-1 text-[9px] text-[#d4c4a8]">
            New
          </span>
          <p className="text-[10px] text-neutral-500">Ships to Premium first</p>
        </div>
      ) : null}
    </div>
  );
}
