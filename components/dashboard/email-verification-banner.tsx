"use client";

import { useActionState } from "react";
import {
  resendVerificationEmailAction,
  type AuthActionState,
} from "@/app/actions/auth";

const initialState: AuthActionState = {};

export function EmailVerificationBanner({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(resendVerificationEmailAction, initialState);

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-sky-500/20 bg-sky-500/[0.08]"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2.5 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-[11px] text-sky-300">
            ✉
          </span>
          <p className="text-[13px] leading-snug text-neutral-300">
            <span className="font-medium text-sky-100">Verify your email</span>
            {" — "}
            We sent a link to <span className="text-neutral-200">{email}</span>.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {state.error && <p className="text-xs text-red-400">{state.error}</p>}
          {state.success && <p className="text-xs text-emerald-400">{state.success}</p>}
          <form action={formAction}>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-sky-400/90 px-3 py-1.5 text-xs font-semibold text-[#090909] transition-colors hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Sending…" : "Resend email"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
