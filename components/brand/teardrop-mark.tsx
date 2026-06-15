import { TEARDROP_PATH, TEARDROP_VIEWBOX } from "@/lib/brand/teardrop";

type TeardropMarkProps = {
  size?: number;
  className?: string;
  fill?: string;
};

export function TeardropMark({ size = 32, className = "", fill = "currentColor" }: TeardropMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={TEARDROP_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path d={TEARDROP_PATH} fill={fill} />
    </svg>
  );
}
