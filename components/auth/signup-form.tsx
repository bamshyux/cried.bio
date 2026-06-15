"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = {};

const inputClass = "bf-input w-full";

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

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
        <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-neutral-400">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="repeat-password" className="mb-1.5 block text-[13px] font-medium text-neutral-400">
          Confirm Password
        </label>
        <input
          id="repeat-password"
          name="repeatPassword"
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

      {state.success && (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[#00e5cc] px-4 py-3 text-sm font-semibold text-[#090909] transition-colors hover:bg-[#00c9b4] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Creating account..." : "Create Profile"}
      </button>

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[#00e5cc] hover:text-[#00c9b4]">
          Login
        </Link>
      </p>
    </form>
  );
}
