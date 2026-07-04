"use client";

import Link from "next/link";

export default function AdminSupportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bf-card mx-auto max-w-lg p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-200">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-white">Support inbox failed to load</h2>
      <p className="mt-2 break-words text-sm text-red-200/80">{error.message || "Unknown error"}</p>
      {error.digest ? (
        <p className="mt-2 text-xs text-neutral-600">Error ID: {error.digest}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#090909] transition-colors hover:bg-neutral-200"
        >
          Try again
        </button>
        <Link
          href="/dashboard/admin"
          className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:text-white"
        >
          Back to admin
        </Link>
      </div>
    </div>
  );
}
