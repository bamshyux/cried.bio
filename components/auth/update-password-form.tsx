"use client";

import { useActionState } from "react";
import { updatePasswordAction, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = {};

const inputClass = "bf-input w-full";

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-neutral-400">
          New password
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
          Confirm new password
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

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[#00e5cc] px-4 py-3 text-sm font-semibold text-[#090909] transition-colors hover:bg-[#00c9b4] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
