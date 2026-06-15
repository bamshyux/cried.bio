"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = {};

const inputClass =
  "bf-input w-full";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-neutral-400">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-[13px] font-medium text-neutral-400">
            Password
          </label>
          <Link href="/forgot-password" className="text-[13px] font-medium text-[#fafafa] hover:text-[#e5e5e5]">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      {state.error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[#fafafa] px-4 py-3 text-sm font-semibold text-[#090909] transition-colors hover:bg-[#e5e5e5] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Logging in..." : "Login"}
      </button>

      <p className="text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-[#fafafa] hover:text-[#e5e5e5]">
          Create Profile
        </Link>
      </p>
    </form>
  );
}
