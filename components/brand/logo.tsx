import { BRAND } from "@/lib/design/tokens";

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  /** Use on light backgrounds */
  variant?: "dark" | "light";
};

/**
 * BioForge mark: rounded frame + link hub (two nodes connected).
 * Monochrome with accent node — readable at small sizes, works on light/dark.
 */
export function BioForgeLogo({
  size = 32,
  showWordmark = true,
  className = "",
  variant = "dark",
}: LogoProps) {
  const isDark = variant === "dark";
  const frameColor = isDark ? "#fafafa" : "#171717";
  const nodePrimary = isDark ? "#fafafa" : "#171717";
  const nodeAccent = BRAND.accent;
  const wordColor = isDark ? "text-white" : "text-neutral-900";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="BioForge"
      >
        <rect
          x="1.5"
          y="1.5"
          width="29"
          height="29"
          rx="8"
          stroke={frameColor}
          strokeWidth="1.5"
        />
        <circle cx="11.5" cy="16" r="3.25" fill={nodeAccent} />
        <circle cx="20.5" cy="16" r="3.25" fill={nodePrimary} fillOpacity={isDark ? 0.35 : 0.25} />
        <path
          d="M14.75 16h2.5"
          stroke={nodePrimary}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <span className={`text-[15px] font-semibold tracking-[-0.02em] ${wordColor}`}>
          BioForge
        </span>
      )}
    </div>
  );
}
