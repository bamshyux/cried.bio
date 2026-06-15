"use server";

import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const repeatPassword = String(formData.get("repeatPassword") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password !== repeatPassword) {
    return { error: "Passwords do not match." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  let sessionCreated = false;

  try {
    const supabase = await createClient();
    const siteUrl = getSiteUrl();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/confirm?next=/dashboard`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.session) {
      sessionCreated = true;
    } else {
      return {
        success:
          "Check your email for a confirmation link to activate your account.",
      };
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reach Supabase.";

    if (message.includes("fetch failed") || message.includes("ENOTFOUND")) {
      return {
        error:
          "Cannot reach your Supabase project URL. Copy the exact Project URL from Supabase Dashboard → Settings → API into .env.local, then restart the dev server.",
      };
    }

    return { error: message };
  }

  if (sessionCreated) {
    redirect("/dashboard");
  }

  return {};
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reach Supabase.";

    if (message.includes("fetch failed") || message.includes("ENOTFOUND")) {
      return {
        error:
          "Cannot reach your Supabase project URL. Copy the exact Project URL from Supabase Dashboard → Settings → API into .env.local, then restart the dev server.",
      };
    }

    return { error: message };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
