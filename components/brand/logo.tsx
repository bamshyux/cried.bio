import { TeardropMark } from "@/components/brand/teardrop-mark";

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  variant?: "dark" | "light" | "muted";
};

/** cried.bio logo — teardrop mark + optional wordmark */
export function CriedLogo({
  size = 32,
  showWordmark = true,
  className = "",
  variant = "dark",
}: LogoProps) {
  const isDark = variant === "dark";
  const isMuted = variant === "muted";
  const markColor = isMuted ? "#525252" : isDark ? "#fafafa" : "#171717";
  const wordColor = isMuted
    ? "text-neutral-500 group-hover:text-neutral-300"
    : isDark
      ? "text-white"
      : "text-neutral-900";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span role="img" aria-label="cried.bio">
        <TeardropMark size={size} fill={markColor} />
      </span>
      {showWordmark && (
        <span className={`text-[15px] font-semibold tracking-[-0.02em] ${wordColor}`}>
          cried.bio
        </span>
      )}
    </div>
  );
}
