type FeatureVisualProps = {
  type:
    | "themes"
    | "effects"
    | "music"
    | "guestbook"
    | "badges"
    | "analytics"
    | "layouts"
    | "customize";
};

export function HomeFeatureVisual({ type }: FeatureVisualProps) {
  return (
    <div className="bf-home-feature-visual relative mb-4 aspect-[16/10] overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.06),transparent_55%)]" />

      {type === "themes" ? (
        <div className="absolute inset-3 flex gap-2">
          <div className="flex-1 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-900 bf-home-feature-shimmer" />
          <div className="flex-1 rounded-lg bg-gradient-to-br from-[#fafafa]/20 to-neutral-800 bf-home-feature-shimmer" style={{ animationDelay: "0.4s" }} />
          <div className="flex-1 rounded-lg bg-gradient-to-br from-neutral-800 to-[#090909] bf-home-feature-shimmer" style={{ animationDelay: "0.8s" }} />
        </div>
      ) : null}

      {type === "effects" ? (
        <>
          <div className="bf-home-feature-orbit absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
          <div className="bf-home-feature-orbit bf-home-feature-orbit--reverse absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.5)]" />
        </>
      ) : null}

      {type === "music" ? (
        <div className="absolute inset-x-4 bottom-4 top-4 flex flex-col justify-end gap-2">
          <div className="flex items-end gap-1 h-10">
            {[3, 6, 4, 8, 5, 7, 4].map((h, i) => (
              <span
                key={i}
                className="bf-home-feature-bar flex-1 rounded-full bg-white/25"
                style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-[10px] text-neutral-400">
            ▶ Now playing
          </div>
        </div>
      ) : null}

      {type === "guestbook" ? (
        <div className="absolute inset-3 space-y-2">
          {["Hey!", "Love the page", "🔥"].map((msg, i) => (
            <div
              key={msg}
              className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-neutral-400 bf-home-feature-shimmer"
              style={{ animationDelay: `${i * 0.35}s`, marginLeft: i * 8 }}
            >
              {msg}
            </div>
          ))}
        </div>
      ) : null}

      {type === "badges" ? (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          {["✦", "★", "◆"].map((badge, i) => (
            <span
              key={badge}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-xs text-white/80 bf-home-feature-float"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}

      {type === "analytics" ? (
        <div className="absolute inset-x-4 bottom-4 flex items-end gap-1.5 h-14">
          {[40, 65, 45, 80, 55, 72, 48].map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-t bg-white/20 bf-home-feature-bar"
              style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      ) : null}

      {type === "layouts" ? (
        <div className="absolute inset-3 grid grid-cols-3 grid-rows-2 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`rounded border border-white/[0.08] bg-white/[0.04] bf-home-feature-shimmer ${i === 1 ? "col-span-2" : ""}`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      ) : null}

      {type === "customize" ? (
        <div className="absolute inset-3 flex gap-2">
          <div className="w-1/3 space-y-1.5">
            {["Accent", "Font", "Bio"].map((label) => (
              <div key={label} className="rounded border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[9px] text-neutral-500">
                {label}
              </div>
            ))}
          </div>
          <div className="flex-1 rounded-lg border border-white/[0.08] bg-[#111] p-2">
            <div className="mx-auto h-6 w-6 rounded-full bg-white/20" />
            <div className="mt-2 h-1.5 w-full rounded bg-white/10" />
            <div className="mt-1 h-1.5 w-2/3 rounded bg-white/[0.06]" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
