"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { BadgeIcon, rarityClass } from "@/components/icons/badge-icons";
import type { BadgeStyleOptions } from "@/lib/badges/display";
import { buildBadgeGlowFilter, COMPACT_BADGE_ICON_SIZE } from "@/lib/badges/glow";
import type { Badge, BadgeInventoryItem, ProfileBadge } from "@/lib/types/badge";
import { RARITY_STYLES } from "@/lib/types/badge";

type BadgeLike = Pick<Badge, "slug" | "name" | "color" | "description" | "rarity" | "category"> & {
  icon_url?: string | null;
  is_featured?: boolean;
};

function resolveDisplayColor(badge: BadgeLike, styleOptions?: BadgeStyleOptions): string {
  if (styleOptions?.monochrome && styleOptions.color) return styleOptions.color;
  return badge.color;
}

function badgeChipBorderStyle(
  displayColor: string,
  options?: { featured?: boolean; monochrome?: boolean },
): CSSProperties {
  if (options?.monochrome) {
    return { boxShadow: `inset 0 0 0 1px ${displayColor}40` };
  }

  const borderAlpha = options?.featured ? "55" : "40";
  const glowAlpha = options?.featured ? "35" : "22";
  const glowSize = options?.featured ? "16px" : "12px";
  return {
    boxShadow: `0 0 0 1px ${displayColor}${borderAlpha}, 0 0 ${glowSize} ${displayColor}${glowAlpha}`,
  };
}

type TooltipPlacement = {
  top: number;
  left: number;
  above: boolean;
};

function computeTooltipPlacement(rect: DOMRect): TooltipPlacement {
  const gap = 8;
  const estimatedHeight = 88;
  const padding = 12;
  const centerX = rect.left + rect.width / 2;
  const above = rect.top - estimatedHeight - gap > padding;

  return {
    left: Math.min(Math.max(centerX, padding + 110), window.innerWidth - padding - 110),
    top: above ? rect.top - gap : rect.bottom + gap,
    above,
  };
}

function BadgeTooltip({
  badge,
  rarityLabel,
  placement,
}: {
  badge: BadgeLike;
  rarityLabel: string;
  placement: TooltipPlacement;
}) {
  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[10000] w-max max-w-[220px] rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-left shadow-xl"
      style={{
        left: placement.left,
        top: placement.top,
        transform: placement.above ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      }}
    >
      <span className="block text-xs font-semibold text-white">{badge.name}</span>
      <span className="mt-0.5 block text-[11px] leading-snug text-neutral-400">{badge.description}</span>
      <span className="mt-1 block text-[10px] uppercase tracking-wider text-neutral-500">{rarityLabel}</span>
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
  const monochrome = styleOptions?.monochrome ?? false;
  const displayColor = resolveDisplayColor(badge, styleOptions);
  const chipRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [placement, setPlacement] = useState<TooltipPlacement | null>(null);

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

  if (compact) {
    return (
      <>
        <span
          ref={chipRef}
          tabIndex={showTooltip ? 0 : undefined}
          onMouseEnter={showTooltip ? handleEnter : undefined}
          onMouseLeave={showTooltip ? handleLeave : undefined}
          onFocus={showTooltip ? handleEnter : undefined}
          onBlur={showTooltip ? handleLeave : undefined}
          className={`bf-badge-icon inline-flex shrink-0 items-center justify-center transition-[transform,filter] duration-200 ease-out ${
            hovered ? "z-[9999] scale-110" : "z-0 scale-100"
          }`}
          style={{
            color: displayColor,
            filter: buildBadgeGlowFilter(badge, {
              hovered,
              featured: badge.is_featured,
              monochrome,
            }),
          }}
        >
          <BadgeIcon
            slug={badge.slug}
            iconUrl={badge.icon_url}
            size={COMPACT_BADGE_ICON_SIZE}
            color={displayColor}
            monochrome={monochrome}
            sharp
          />
        </span>
        {showTooltip && hovered && placement && (
          <BadgeTooltip badge={badge} rarityLabel={rarity.label} placement={placement} />
        )}
      </>
    );
  }

  return (
    <>
      <span
        ref={chipRef}
        tabIndex={showTooltip ? 0 : undefined}
        onMouseEnter={showTooltip ? handleEnter : undefined}
        onMouseLeave={showTooltip ? handleLeave : undefined}
        onFocus={showTooltip ? handleEnter : undefined}
        onBlur={showTooltip ? handleLeave : undefined}
        className={`relative inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-transform hover:scale-[1.03] ${
          hovered ? "z-[9999]" : "z-0"
        }`}
        style={{
          backgroundColor: `${displayColor}18`,
          color: displayColor,
          ...badgeChipBorderStyle(displayColor, { featured: badge.is_featured, monochrome }),
        }}
      >
        <BadgeIcon
          slug={badge.slug}
          iconUrl={badge.icon_url}
          size={compact ? 12 : 14}
          color={displayColor}
          monochrome={monochrome}
        />
        {!compact && <span>{badge.name}</span>}
      </span>
      {showTooltip && hovered && placement && (
        <BadgeTooltip badge={badge} rarityLabel={rarity.label} placement={placement} />
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
    <div className={`bf-badge-row relative overflow-visible ${compact ? "" : "bf-profile-row gap-2"}`}>
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
  const style = RARITY_STYLES[badge.rarity];
  const monochrome = styleOptions?.monochrome ?? false;
  const displayColor = resolveDisplayColor(badge, styleOptions);

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all ${
        earned
          ? monochrome
            ? "border-white/[0.08] bg-[#0f0f0f]"
            : "border-white/[0.08] bg-[#0f0f0f]"
          : "border-white/[0.04] bg-[#0a0a0a] opacity-50 grayscale"
      }`}
      style={
        earned && !monochrome
          ? { boxShadow: `inset 0 0 0 1px ${displayColor}30, 0 0 14px ${displayColor}18` }
          : earned && monochrome
            ? { boxShadow: `inset 0 0 0 1px ${displayColor}25` }
            : undefined
      }
      draggable={draggable && earned}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-white/[0.06]"
          style={{ backgroundColor: `${displayColor}15` }}
        >
          <BadgeIcon
            slug={badge.slug}
            iconUrl={badge.icon_url}
            size={20}
            color={displayColor}
            monochrome={monochrome}
            sharp
          />
        </div>
        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500">
          {style.label}
        </span>
      </div>
      <p className="text-sm font-medium text-white">{badge.name}</p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">{badge.description}</p>
      {earned && (onToggleVisible || onToggleFeatured) && (
        <div className="mt-3 flex gap-2 border-t border-white/[0.06] pt-3">
          {onToggleVisible && (
            <button
              type="button"
              onClick={onToggleVisible}
              className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                badge.is_visible !== false ? "bg-[#fafafa]/10 text-[#fafafa]" : "bg-white/[0.04] text-neutral-500"
              }`}
            >
              {badge.is_visible !== false ? "Visible" : "Hidden"}
            </button>
          )}
          {onToggleFeatured && (
            <button
              type="button"
              onClick={onToggleFeatured}
              className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                badge.is_featured ? "bg-amber-500/10 text-amber-400" : "bg-white/[0.04] text-neutral-500"
              }`}
            >
              {badge.is_featured ? "Featured" : "Feature"}
            </button>
          )}
        </div>
      )}
      {!earned && (
        <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-neutral-600">Locked</p>
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
