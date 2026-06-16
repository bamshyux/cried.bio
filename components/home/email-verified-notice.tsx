"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function EmailVerifiedNoticeInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("email_verified") !== "1") return;

    setVisible(true);

    const url = new URL(window.location.href);
    url.searchParams.delete("email_verified");
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    router.replace(nextUrl, { scroll: false });

    const timer = window.setTimeout(() => setVisible(false), 8000);
    return () => window.clearTimeout(timer);
  }, [searchParams, router]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-20 z-[120] flex justify-center px-4 sm:top-[4.75rem]"
    >
      <div className="pointer-events-auto flex max-w-lg items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100 shadow-[0_12px_40px_rgba(16,185,129,0.18)] backdrop-blur-md">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="font-medium tracking-tight">Your Email Has Been Successfully Verified</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="ml-1 shrink-0 rounded-full p-1 text-emerald-200/80 transition-colors hover:bg-emerald-500/15 hover:text-white"
          aria-label="Dismiss notification"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function EmailVerifiedNotice() {
  return (
    <Suspense fallback={null}>
      <EmailVerifiedNoticeInner />
    </Suspense>
  );
}
