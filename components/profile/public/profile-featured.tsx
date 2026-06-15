"use client";

import type { FeaturedBlock } from "@/lib/types/featured";
import type { ProfileSettings } from "@/lib/types/settings";

export function ProfileFeaturedSection({
  blocks,
  settings,
}: {
  blocks: FeaturedBlock[];
  settings: ProfileSettings;
}) {
  const enabled = blocks.filter((b) => b.is_enabled);
  if (enabled.length === 0) return null;

  return (
    <div className="mb-5">
      <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-neutral-500">Featured</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {enabled.map((block) => (
          <FeaturedCard key={block.id} block={block} settings={settings} />
        ))}
      </div>
    </div>
  );
}

function FeaturedCard({ block, settings }: { block: FeaturedBlock; settings: ProfileSettings }) {
  const accent = block.accent_color || settings.accent_color;
  const inner = (
    <div
      className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f0f0f] p-4 transition-all hover:border-white/[0.12]"
      style={{ boxShadow: `0 0 0 1px ${accent}15` }}
    >
      {block.thumbnail_url && (
        <div className="mb-3 overflow-hidden rounded-lg">
          <img src={block.thumbnail_url} alt="" className="h-24 w-full object-cover" />
        </div>
      )}
      <p className="text-sm font-semibold text-white">{block.title}</p>
      {block.description && (
        <p className="mt-1 line-clamp-2 text-xs text-neutral-400">{block.description}</p>
      )}
      <span
        className="mt-3 inline-block text-[10px] font-medium uppercase tracking-wider"
        style={{ color: accent }}
      >
        {block.block_type.replace("_", " ")}
      </span>
    </div>
  );

  if (block.url && block.block_type !== "text") {
    return (
      <a href={block.url} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }

  return inner;
}
