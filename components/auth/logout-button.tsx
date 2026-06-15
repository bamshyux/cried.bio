"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/actions/auth";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => signOutAction())}
      disabled={isPending}
      className="rounded-lg border border-white/[0.06] px-3.5 py-1.5 text-[13px] font-medium text-neutral-400 transition-colors hover:border-white/10 hover:text-white disabled:opacity-50"
    >
      {isPending ? "Logging out..." : "Log out"}
    </button>
  );
}
