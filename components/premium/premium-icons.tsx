import type { ComponentType } from "react";
import {
  LuAward,
  LuChartBar,
  LuCalendar,
  LuCheck,
  LuCircleDashed,
  LuFiles,
  LuLayoutGrid,
  LuMusic,
  LuPlay,
  LuRocket,
  LuSlidersHorizontal,
  LuSparkles,
  LuType,
  LuX,
} from "react-icons/lu";
import type { PremiumFeaturePreview } from "@/lib/premium/comparison-features";

const FEATURE_ICONS: Record<PremiumFeaturePreview, ComponentType<{ className?: string; size?: number }>> = {
  music: LuMusic,
  pages: LuFiles,
  badge: LuAward,
  fonts: LuType,
  effects: LuSparkles,
  widgets: LuLayoutGrid,
  schedules: LuCalendar,
  customize: LuSlidersHorizontal,
  analytics: LuChartBar,
  "early-access": LuRocket,
};

export function PremiumFeatureIcon({
  type,
  className = "h-[18px] w-[18px]",
}: {
  type: PremiumFeaturePreview;
  className?: string;
}) {
  const Icon = FEATURE_ICONS[type];
  return <Icon className={className} aria-hidden />;
}

export function PremiumIncludedIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <LuCheck className={className} aria-hidden strokeWidth={2.25} />;
}

export function PremiumExcludedIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <LuX className={className} aria-hidden strokeWidth={2} />;
}

export function PremiumPartialIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <LuCircleDashed className={className} aria-hidden strokeWidth={2} />;
}

export function PremiumPlayIcon({ className = "h-3 w-3" }: { className?: string }) {
  return <LuPlay className={className} aria-hidden fill="currentColor" strokeWidth={0} />;
}
