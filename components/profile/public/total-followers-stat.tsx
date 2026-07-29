"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LinkIcon } from "@/components/icons/social-icons";
import { cardClassName } from "@/components/dashboard/form-fields";
import { formatCompactCount, formatFullCount } from "@/lib/format/compact-count";
import { getPlatform } from "@/lib/social-platforms";
import type { TotalFollowersSummary } from "@/lib/types/link-platform-stats";

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TotalFollowersModal({
  summary,
  onClose,
}: {
  summary: TotalFollowersSummary;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="total-followers-title"
        className={`${cardClassName} flex max-h-[min(82vh,680px)] w-full max-w-md flex-col overflow-hidden border border-white/[0.08] shadow-2xl sm:rounded-3xl rounded-t-3xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center pt-3 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-white/15" aria-hidden />
        </div>

        <div className="border-b border-white/[0.06] px-5 py-4">
          <p id="total-followers-title" className="text-lg font-semibold text-white">
            {formatFullCount(summary.total)} Total Followers
          </p>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {summary.items.map((item) => {
            const platform = getPlatform(item.platform);
            const label = platform?.name ?? item.platform;
            const handle = item.platform_username ?? item.display_name ?? label;
            const count = item.follower_count ?? 0;

            return (
              <li
                key={item.link_id}
                className="flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-white/[0.03]"
              >
                <div className="relative shrink-0">
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-sm font-semibold text-white">
                      {handle.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-[#141414] bg-[#141414]">
                    <LinkIcon platform={item.platform} size={12} />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{handle}</p>
                  <p className="text-xs text-neutral-500">
                    {formatCompactCount(count)} {item.count_label}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-white/[0.06] px-5 py-4">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function TotalFollowersStat({ summary }: { summary: TotalFollowersSummary }) {
  const [open, setOpen] = useState(false);

  if (summary.total <= 0 || summary.items.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bf-total-followers-stat group mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-200 transition-colors hover:text-white"
      >
        <span>{formatCompactCount(summary.total)} Total Followers</span>
        <ChevronDownIcon className="h-4 w-4 text-neutral-500 transition-transform group-hover:text-neutral-300" />
      </button>

      {open ? <TotalFollowersModal summary={summary} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
