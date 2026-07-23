import { LuCheck } from "react-icons/lu";

const TRUST_ITEMS = ["Free forever", "Custom domains", "Premium effects", "No ads"] as const;

export function HomeHeroTrustRow() {
  return (
    <div className="bf-home-enter bf-home-enter-5 mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
      {TRUST_ITEMS.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 sm:text-[13px]"
        >
          <LuCheck className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={2.25} aria-hidden />
          {item}
        </span>
      ))}
    </div>
  );
}
