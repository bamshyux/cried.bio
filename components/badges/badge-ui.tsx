"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BadgeMedallion } from "@/components/badges/badge-medallion";
import { rarityClass } from "@/components/icons/badge-icons";
import type { BadgeStyleOptions } from "@/lib/badges/display";
import { COMPACT_BADGE_ICON_SIZE } from "@/lib/badges/seal-utils";
import { getRarityVisual } from "@/lib/badges/rarity-visuals";
import type { Badge, BadgeInventoryItem, ProfileBadge } from "@/lib/types/badge";

type BadgeLike = Pick<Badge, "slug" | "name" | "color" | "description" | "rarity" | "category"> & {
  icon_url?: string | null;
  is_featured?: boolean;
};

function resolveDisplayColor(badge: BadgeLike, styleOptions?: BadgeStyleOptions): string {
  if (styleOptions?.monochrome && styleOptions.color) return styleOptions.color;
  return badge.color;
}

type TooltipPlacement = {
  top: number;
  left: number;
  above: boolean;
};

function computeTooltipPlacement(rect: DOMRect): TooltipPlacement {
  const gap = 10;
  const estimatedHeight = 96;
  const padding = 12;
  const centerX = rect.left + rect.width / 2;
  const above = rect.top - estimatedHeight - gap > padding;

  return {
    left: Math.min(Math.max(centerX, padding + 120), window.innerWidth - padding - 120),
    top: above ? rect.top - gap : rect.bottom + gap,
    above,
  };
}

function BadgeTooltip({
  badge,
  rarityLabel,
  rarityAccent,
  placement,
}: {
  badge: BadgeLike;
  rarityLabel: string;
  rarityAccent: string;
  placement: TooltipPlacement;
}) {
  return createPortal(
    <div
      role="tooltip"
      className="bf-badge-tooltip pointer-events-none fixed z-[10000] w-max max-w-[240px] overflow-hidden rounded-xl bg-[#0a0a0a]/95 px-3.5 py-2.5 text-left shadow-2xl backdrop-blur-md"
      style={{
        left: placement.left,
        top: placement.top,
        transform: placement.above ? "translate(-50%, -100%)" : "translate(-50%, 0)",
        boxShadow: `0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06), 0 0 24px ${rarityAccent}22`,
      }}
    >
      <div className="mb-2 h-0.5 w-full rounded-full opacity-80" style={{ background: rarityAccent }} />
      <span className="block text-xs font-semibold tracking-tight text-white">{badge.name}</span>
      <span className="mt-1 block text-[11px] leading-snug text-neutral-400">{badge.description}</span>
      <span
        className="mt-1.5 inline-block text-[9px] font-bold uppercase tracking-[0.2em]"
        style={{ color: rarityAccent }}
      >
        {rarityLabel}
      </span>
    </div>,
    document.body,
  );
}

export function BadgeChip({
  badge,
  compact = false,
  showTooltip = true,
  styleOptions,
}: {
  badge: BadgeLike;
  compact?: boolean;
  showTooltip?: boolean;
  styleOptions?: BadgeStyleOptions;
}) {
  const rarity = rarityClass(badge.rarity);
  const rarityVisual = getRarityVisual(badge.rarity);
  const monochrome = styleOptions?.monochrome ?? false;
  const glowEnabled = styleOptions?.glow ?? true;
  const displayColor = resolveDisplayColor(badge, styleOptions);
  const chipRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [placement, setPlacement] = useState<TooltipPlacement | null>(null);
  const medallionSize = compact ? COMPACT_BADGE_ICON_SIZE : 24;

  const updatePlacement = useCallback(() => {
    const rect = chipRef.current?.getBoundingClientRect();
    if (rect) setPlacement(computeTooltipPlacement(rect));
  }, []);

  const handleEnter = () => {
    updatePlacement();
    setHovered(true);
  };

  const handleLeave = () => {
    setHovered(false);
    setPlacement(null);
  };

  const medallion = (
    <BadgeMedallion
      badge={{
        slug: badge.slug,
        color: displayColor,
        rarity: badge.rarity,
        icon_url: badge.icon_url,
        is_featured: badge.is_featured,
      }}
      size={medallionSize}
      hovered={hovered}
      monochrome={monochrome}
      featured={badge.is_featured}
      glowEnabled={glowEnabled}
    />
  );

  return (
    <>
      <span
        ref={chipRef}
        tabIndex={showTooltip ? 0 : undefined}
        onMouseEnter={showTooltip ? handleEnter : undefined}
        onMouseLeave={showTooltip ? handleLeave : undefined}
        onFocus={showTooltip ? handleEnter : undefined}
        onBlur={showTooltip ? handleLeave : undefined}
        className={`bf-badge-chip inline-flex shrink-0 items-center gap-2 transition-transform duration-200 ease-out ${
          hovered ? "z-[9999]" : "z-0"
        } ${compact ? "" : "pr-0.5"}`}
      >
        {medallion}
        {!compact && (
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-white">{badge.name}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: rarityVisual.accent }}>
              {rarity.label}
            </span>
          </span>
        )}
      </span>
      {showTooltip && hovered && placement && (
        <BadgeTooltip
          badge={badge}
          rarityLabel={rarity.label}
          rarityAccent={monochrome ? "#e4e4e7" : rarityVisual.accent}
          placement={placement}
        />
      )}
    </>
  );
}

export function BadgeRow({
  badges,
  compact = false,
  styleOptions,
}: {
  badges: ProfileBadge[];
  compact?: boolean;
  styleOptions?: BadgeStyleOptions;
}) {
  if (badges.length === 0) return null;

  return (
    <div className={`bf-badge-row relative overflow-visible ${compact ? "gap-1" : "bf-profile-row gap-3"}`}>
      {badges.map((badge) => (
        <BadgeChip key={badge.profile_badge_id} badge={badge} compact={compact} styleOptions={styleOptions} />
      ))}
    </div>
  );
}

export function BadgeCard({
  badge,
  earned,
  onToggleVisible,
  onToggleFeatured,
  draggable = false,
  styleOptions,
}: {
  badge: BadgeInventoryItem;
  earned: boolean;
  onToggleVisible?: () => void;
  onToggleFeatured?: () => void;
  draggable?: boolean;
  styleOptions?: BadgeStyleOptions;
}) {
  const rarityVisual = getRarityVisual(badge.rarity);
  const monochrome = styleOptions?.monochrome ?? false;
  const glowEnabled = styleOptions?.glow ?? true;
  const displayColor = resolveDisplayColor(badge, styleOptions);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${
        earned ? "bg-[#0c0c0c]/90" : "bg-[#080808]/80 opacity-45"
      } ${draggable && earned ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={
        earned
          ? {
              boxShadow: hovered
                ? `0 0 0 1px ${rarityVisual.accent}44, 0 16px 48px rgba(0,0,0,0.45), 0 0 32px ${rarityVisual.aura}`
                : `0 0 0 1px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.35), 0 0 20px ${rarityVisual.aura}`,
            }
          : undefined
      }
      draggable={draggable && earned}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 50% 28%, ${rarityVisual.aura} 0%, transparent 62%)`,
        }}
        aria-hidden
      />

      <div className="relative flex flex-col items-center text-center">
        <BadgeMedallion
          badge={{
            slug: badge.slug,
            color: displayColor,
            rarity: badge.rarity,
            icon_url: badge.icon_url,
            is_featured: badge.is_featured,
          }}
          size={48}
          hovered={hovered}
          monochrome={monochrome || !earned}
          featured={badge.is_featured}
          glowEnabled={glowEnabled}
        />

        <p
          className="mt-3 text-[9px] font-bold uppercase tracking-[0.22em]"
          style={{ color: earned ? rarityVisual.accent : "#52525b" }}
        >
          {rarityVisual.label}
        </p>
        <p className={`mt-1 text-sm font-semibold ${earned ? "text-white" : "text-neutral-500"}`}>{badge.name}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{badge.description}</p>
      </div>

      {earned && (onToggleVisible || onToggleFeatured) && (
        <div className="relative mt-4 flex justify-center gap-2 border-t border-white/[0.05] pt-3">
          {onToggleVisible && (
            <button
              type="button"
              onClick={onToggleVisible}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors ${
                badge.is_visible !== false
                  ? "bg-white/[0.08] text-white"
                  : "bg-white/[0.03] text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {badge.is_visible !== false ? "Visible" : "Hidden"}
            </button>
          )}
          {onToggleFeatured && (
            <button
              type="button"
              onClick={onToggleFeatured}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors ${
                badge.is_featured
                  ? "bg-amber-500/15 text-amber-300"
                  : "bg-white/[0.03] text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {badge.is_featured ? "Featured" : "Feature"}
            </button>
          )}
        </div>
      )}
      {!earned && (
        <p className="relative mt-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">
          Locked
        </p>
      )}
    </div>
  );
}

export function ProfileHoverPreview({
  displayName,
  username,
  badges,
  styleOptions,
}: {
  displayName: string;
  username: string;
  badges: ProfileBadge[];
  styleOptions?: BadgeStyleOptions;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#141414] p-4 shadow-2xl">
      <p className="font-medium text-white">{displayName}</p>
      <p className="text-xs text-neutral-500">@{username}</p>
      {badges.length > 0 && (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <BadgeRow badges={badges} compact styleOptions={styleOptions} />
        </div>
      )}
    </div>
  );
}

export type { BadgeStyleOptions };
