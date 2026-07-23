import Link from "next/link";
import { IconExternal } from "@/components/icons/dashboard-icons";

type ViewLiveProfileButtonProps = {
  username?: string | null;
  /** header = sticky dashboard bar; inline = compact text link */
  variant?: "header" | "inline";
  className?: string;
};

const headerCtaClassName =
  "bf-live-profile-cta group inline-flex max-w-full shrink-0 items-center gap-2.5 rounded-full px-4 py-2 text-[13px] font-semibold";

const headerSetupCtaClassName =
  "bf-live-profile-cta bf-live-profile-cta--setup group inline-flex max-w-full shrink-0 items-center gap-2.5 rounded-full px-4 py-2 text-[13px] font-semibold";

export function ViewLiveProfileButton({
  username,
  variant = "header",
  className = "",
}: ViewLiveProfileButtonProps) {
  if (!username?.trim()) {
    return (
      <Link
        href="/dashboard/profile"
        className={
          variant === "header"
            ? `${headerSetupCtaClassName} ${className}`
            : `text-[13px] font-medium text-neutral-300 hover:text-white ${className}`
        }
      >
        {variant === "header" ? "Set up profile" : "Set up profile →"}
      </Link>
    );
  }

  const profilePath = `/${username}`;

  if (variant === "inline") {
    return (
      <Link
        href={profilePath}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 font-medium text-neutral-300 hover:text-white ${className}`}
      >
        View live profile
        <IconExternal size={12} className="opacity-70" />
      </Link>
    );
  }

  return (
    <Link
      href={profilePath}
      target="_blank"
      rel="noopener noreferrer"
      className={`${headerCtaClassName} ${className}`}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        <span className="bf-live-profile-cta__pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400/50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#101010] group-hover:ring-[#161616]" />
      </span>
      <span className="flex min-w-0 items-baseline gap-1.5 whitespace-nowrap text-neutral-100">
        <span>View live profile</span>
        <span className="hidden font-mono text-[11px] font-medium text-emerald-400/70 sm:inline">
          /{username}
        </span>
      </span>
      <IconExternal
        size={13}
        className="shrink-0 text-neutral-500 transition-colors group-hover:text-neutral-300"
      />
    </Link>
  );
}
