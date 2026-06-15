"use client";

import Link from "next/link";
import { useTransition } from "react";
import { signOutAction } from "@/app/actions/auth";

export function LogoutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => signOutAction())}
      disabled={isPending}
      className={
        className ??
        "rounded-lg border border-white/[0.06] px-3.5 py-1.5 text-[13px] font-medium text-neutral-400 transition-colors hover:border-white/10 hover:text-white disabled:opacity-50"
      }
    >
      {isPending ? "Logging out..." : "Log out"}
    </button>
  );
}

export function HomeNav({
  isLoggedIn,
  username,
}: {
  isLoggedIn: boolean;
  username: string | null;
}) {
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
        >
          Dashboard
        </Link>
        {username && (
          <Link
            href={`/${username}`}
            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white sm:inline-block"
          >
            My Profile
          </Link>
        )}
        <LogoutButton className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#090909] transition-colors hover:bg-neutral-200 disabled:opacity-50" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
      >
        Login
      </Link>
      <Link
        href="/signup"
        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#090909] transition-colors hover:bg-neutral-200"
      >
        Create Profile
      </Link>
    </div>
  );
}
