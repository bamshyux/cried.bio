"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  SupportWidgetBody,
  SupportWidgetTrigger,
  SupportWidgetUnreadPoller,
} from "@/components/support/support-widget";
import { isPublicProfilePath } from "@/lib/profile";

function ScrollToTopButtonInner() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="bf-site-dock__button bf-site-dock__button--top"
    >
      <svg
        className="h-5 w-5 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}

export function FloatingSiteDock({ userId }: { userId: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  if (isPublicProfilePath(pathname)) {
    return null;
  }

  return (
    <div className="bf-site-dock">
      {open ? (
        <SupportWidgetBody userId={userId} onOpenChange={setOpen} onUnreadChange={setUnreadTotal} />
      ) : (
        <SupportWidgetUnreadPoller userId={userId} onUnreadChange={setUnreadTotal} />
      )}
      <div className="bf-site-dock__buttons">
        <ScrollToTopButtonInner />
        <SupportWidgetTrigger
          userId={userId}
          unreadTotal={unreadTotal}
          open={open}
          onToggle={() => setOpen((prev) => !prev)}
        />
      </div>
    </div>
  );
}
