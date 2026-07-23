"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PlatformUpdate } from "@/lib/types/platform-update";

const SEEN_STORAGE_KEY = "bf_platform_updates_seen_at";

function YieldUpdateIcon({
  className,
  filled = false,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M12 3.25 3.5 19.25h17L12 3.25Z"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.22 : undefined}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 9.5v4.25"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.75" r="1" fill="currentColor" />
    </svg>
  );
}

function formatUpdateDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function authorLabel(update: PlatformUpdate) {
  const name = update.author?.display_name || update.author?.username;
  return name ? `by ${name}` : "by team";
}

function readSeenAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SEEN_STORAGE_KEY);
}

function writeSeenAt(iso: string) {
  localStorage.setItem(SEEN_STORAGE_KEY, iso);
}

export function PlatformUpdateWidget({ updates }: { updates: PlatformUpdate[] }) {
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSeenAt(readSeenAt());
  }, []);

  const latestAt = useMemo(
    () => updates.reduce((max, u) => (u.created_at > max ? u.created_at : max), ""),
    [updates],
  );

  const unreadCount = useMemo(() => {
    if (!seenAt) return updates.length;
    return updates.filter((u) => u.created_at > seenAt).length;
  }, [updates, seenAt]);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", handlePointer);
    }, 0);

    document.addEventListener("keydown", handleEscape);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const markSeen = () => {
    if (!latestAt) return;
    writeSeenAt(latestAt);
    setSeenAt(latestAt);
  };

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) markSeen();
      return next;
    });
  };

  if (updates.length === 0) return null;

  return (
    <div className={`bf-platform-updates${unreadCount > 0 ? " bf-platform-updates--unread" : ""}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className={`bf-platform-updates__trigger${unreadCount > 0 ? " bf-platform-updates__trigger--unread" : ""}${open ? " bf-platform-updates__trigger--open" : ""}`}
        aria-label={`Platform updates${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <span className="bf-platform-updates__trigger-icon" aria-hidden>
          <YieldUpdateIcon className="h-5 w-5" filled />
        </span>
        <span className="bf-platform-updates__trigger-label">Update</span>
        {unreadCount > 0 ? (
          <span className="bf-platform-updates__badge bf-platform-updates__badge--pulse" aria-hidden>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div ref={panelRef} className="bf-platform-updates__panel" role="dialog" aria-label="Platform updates">
          <div className="bf-platform-updates__panel-header">
            <div className="bf-platform-updates__panel-icon">
              <YieldUpdateIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="bf-platform-updates__panel-title">Updates</p>
              <p className="bf-platform-updates__panel-subtitle">
                {updates.length} active update{updates.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="bf-platform-updates__list">
            {updates.map((update, index) => {
              const isNew = !seenAt || update.created_at > seenAt;
              return (
                <article key={update.id} className="bf-platform-updates__item">
                  <div className="bf-platform-updates__item-head">
                    <div className="bf-platform-updates__item-icon">
                      {update.icon_url ? (
                        <Image
                          src={update.icon_url}
                          alt=""
                          width={18}
                          height={18}
                          className="h-[18px] w-[18px] object-contain"
                          unoptimized
                        />
                      ) : (
                        <YieldUpdateIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="bf-platform-updates__item-title">{update.title}</h3>
                        {isNew && index === 0 && unreadCount > 0 ? (
                          <span className="bf-platform-updates__new">New</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {update.image_url ? (
                    <div className="bf-platform-updates__item-image-wrap">
                      <Image
                        src={update.image_url}
                        alt=""
                        width={640}
                        height={360}
                        className="bf-platform-updates__item-image"
                        unoptimized
                      />
                    </div>
                  ) : null}

                  <p className="bf-platform-updates__item-body">{update.body}</p>

                  <div className="bf-platform-updates__item-meta">
                    <span>{formatUpdateDate(update.created_at)}</span>
                    <span>{authorLabel(update)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
