"use server";

import { buildAuthEmailErrorMessage, isEmailDeliveryError, SIGNUP_EMAIL_VERIFY_NEXT } from "@/lib/auth/auth-email-shared";
import { deliverSignupConfirmationEmail } from "@/lib/auth/deliver-auth-link-email";
import { deliverPasswordResetEmail } from "@/lib/auth/send-password-reset";
import { sendWelcomeEmail } from "@/lib/email";
import { syncSignupBadges } from "@/lib/badges/signup-badges";
import { getProfileByUserId } from "@/lib/data/profiles";
import { guardSensitiveAction } from "@/lib/security/guard-action";
import { getSiteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

export type AuthActionState = {
  error?: string;
  success?: string;
};

async function finishNewSignup(userId: string, email: string) {
  await syncSignupBadges(userId);
  const profile = await getProfileByUserId(userId);
  void sendWelcomeEmail({
    to: email,
    displayName: profile?.display_name,
    username: profile?.username,
  });

  const { recordLoginEvent } = await import("@/lib/data/account-settings");
  await recordLoginEvent(userId, true);
}

function isDuplicateEmailError(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("already") || lower.includes("registered") || lower.includes("exists");
}

async function signUpWithAdmin(email: string, password: string): Promise<AuthActionState | "ok"> {
  const admin = createAdminClient();
  if (!admin) return { error: "admin_unavailable" };

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  });

  if (createError) {
    if (isDuplicateEmailError(createError.message)) {
      return { error: "An account with this email already exists. Try logging in." };
    }
    return { error: createError.message };
  }

  const delivery = await deliverSignupConfirmationEmail(email);
  if (!delivery.sent) {
    return {
      error: buildAuthEmailErrorMessage({
        purpose: "signup",
        resendError: delivery.resendError,
        supabaseError: delivery.supabaseError,
      }),
    };
  }

  const supabase = await createClient();
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!signInError && signInData.user) {
    if (signInData.user.email_confirmed_at) {
      await finishNewSignup(signInData.user.id, email);
    } else {
      const { recordLoginEvent } = await import("@/lib/data/account-settings");
      await recordLoginEvent(signInData.user.id, true);
    }
    return "ok";
  }

  void created;
  return {
    success: "Check your email for a confirmation link to activate your account.",
  };
}

async function signUpWithPublicClient(email: string, password: string): Promise<AuthActionState | "ok"> {
  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent(SIGNUP_EMAIL_VERIFY_NEXT)}`,
    },
  });

  if (error) {
    if (isDuplicateEmailError(error.message)) {
      return { error: "An account with this email already exists. Try logging in." };
    }
    if (isEmailDeliveryError(error.message)) {
      const delivery = await deliverSignupConfirmationEmail(email);
      if (delivery.sent) {
        return {
          success: "Check your email for a confirmation link to activate your account.",
        };
      }
      return { error: "email_delivery_failed" };
    }
    return { error: error.message };
  }

  if (data.session && data.user) {
    if (data.user.email_confirmed_at) {
      await finishNewSignup(data.user.id, email);
    } else {
      void deliverSignupConfirmationEmail(email);
      const { recordLoginEvent } = await import("@/lib/data/account-settings");
      await recordLoginEvent(data.user.id, true);
    }
    return "ok";
  }

  if (data.user) {
    const delivery = await deliverSignupConfirmationEmail(email);
    if (!delivery.sent) {
      return { error: "email_delivery_failed" };
    }
    return {
      success: "Check your email for a confirmation link to activate your account.",
    };
  }

  return { error: "Could not create your account. Please try again." };
}

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

  const guardError = await guardSensitiveAction({ scope: "signup" });
  if (guardError) return { error: guardError };

  try {
    const adminResult = await signUpWithAdmin(email, password);
    if (adminResult === "ok") {
      redirect("/dashboard");
    }

    if (adminResult.error !== "admin_unavailable") {
      return adminResult;
    }

    const publicResult = await signUpWithPublicClient(email, password);
    if (publicResult === "ok") {
      redirect("/dashboard");
    }

    if (publicResult.error === "email_delivery_failed") {
      console.error("[auth] signup confirmation email delivery failed");
      return {
        error: buildAuthEmailErrorMessage({
          purpose: "signup",
        }),
      };
    }

    return publicResult;
  } catch (error) {
    if (isRedirectError(error)) throw error;

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

  const guardError = await guardSensitiveAction({ scope: "login" });
  if (guardError) return { error: guardError };

  try {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user?.id) {
      const { recordLoginEvent } = await import("@/lib/data/account-settings");
      await recordLoginEvent(data.user.id, true);
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;

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

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Email is required." };
  }

  const guardError = await guardSensitiveAction({ scope: "password_reset", email });
  if (guardError) return { error: guardError };

  const result = await deliverPasswordResetEmail(email);

  if (!result.sent) {
    return {
      error: buildAuthEmailErrorMessage({
        purpose: "password_reset",
        resendError: result.resendError,
        supabaseError: result.supabaseError,
      }),
    };
  }

  return {
    success: "If an account exists for that email, a reset link has been sent.",
  };
}

export async function updatePasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const repeatPassword = String(formData.get("repeatPassword") ?? "");

  if (!password || !repeatPassword) {
    return { error: "Password and confirmation are required." };
  }

  if (password !== repeatPassword) {
    return { error: "Passwords do not match." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function resendVerificationEmailAction(
  _prevState: AuthActionState,
  _formData: FormData,
): Promise<AuthActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "You must be logged in with an email address." };
  }

  if (user.email_confirmed_at) {
    return { success: "Your email is already verified." };
  }

  const result = await deliverSignupConfirmationEmail(user.email);
  if (!result.sent) {
    return {
      error: buildAuthEmailErrorMessage({
        purpose: "signup",
        resendError: result.resendError,
        supabaseError: result.supabaseError,
      }),
    };
  }

  return { success: "Confirmation email sent. Check your inbox and spam folder." };
}
