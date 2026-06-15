import { SITE_HOST } from "@/lib/site";

const LINKS = ["Discord", "Twitch", "Portfolio"];

export function HomePreview() {
  return (
    <section id="preview" className="mx-auto max-w-md px-6 pb-24">
      <div className="bf-home-preview rounded-2xl border border-white/[0.08] bg-[#141414]/80 p-6 shadow-[0_24px_80px_rgba(255,255,255,0.08)] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="bf-home-preview-avatar relative h-14 w-14 shrink-0 rounded-full bg-[#1a1a1a] ring-1 ring-white/[0.08]">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.35),transparent_65%)]" />
          </div>
          <div className="text-left">
            <p className="font-medium text-white">@yourname</p>
            <p className="text-sm text-neutral-500">Creator · Gamer</p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {LINKS.map((link, index) => (
            <div
              key={link}
              className={`bf-home-preview-link bf-home-preview-link-${index + 1} rounded-lg border border-white/[0.04] bg-[#0f0f0f] px-4 py-2.5 text-sm text-neutral-300`}
            >
              {link}
            </div>
          ))}
        </div>
        <p className="bf-home-preview-url mt-4 text-center font-mono text-xs text-neutral-600">
          {SITE_HOST}/yourname
        </p>
      </div>
    </section>
  );
}
