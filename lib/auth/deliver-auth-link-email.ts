import {
  type AuthEmailDeliveryResult,
  type AuthLinkType,
  buildAuthConfirmUrl,
  buildRedirectCandidates,
  isRedirectUrlError,
  SIGNUP_EMAIL_VERIFY_NEXT,
} from "@/lib/auth/auth-email-shared";
import { getResendClient } from "@/lib/email/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";

type DeliverAuthLinkEmailInput = {
  email: string;
  linkType: AuthLinkType;
  nextPath?: string;
  newEmail?: string;
  sendEmail: (to: string, confirmUrl: string) => Promise<AuthEmailDeliveryResult>;
  supabaseFallback?: (redirectTo: string) => Promise<{ error?: string }>;
};

async function sendViaResendApi(input: DeliverAuthLinkEmailInput): Promise<AuthEmailDeliveryResult> {
  const admin = createAdminClient();
  const resend = getResendClient();
  if (!admin || !resend) {
    return { sent: false, resendError: "Resend API is not configured on the server." };
  }

  const siteUrl = getSiteUrl();
  const nextPath = input.nextPath ?? "/dashboard";
  let lastError: string | undefined;

  for (const redirectTo of buildRedirectCandidates(siteUrl, nextPath, input.linkType)) {
    const response =
      input.linkType === "magiclink"
        ? await admin.auth.admin.generateLink({
            type: "magiclink",
            email: input.email,
            options: { redirectTo },
          })
        : input.linkType === "recovery"
          ? await admin.auth.admin.generateLink({
              type: "recovery",
              email: input.email,
              options: { redirectTo },
            })
        : input.linkType === "email_change_new"
          ? await admin.auth.admin.generateLink({
              type: "email_change_new",
              email: input.email,
              newEmail: input.newEmail ?? input.email,
              options: { redirectTo },
            })
          : await admin.auth.admin.generateLink({
              type: "email_change_current",
              email: input.email,
              newEmail: input.newEmail ?? input.email,
              options: { redirectTo },
            });

    const { data, error } = response;

    if (error) {
      lastError = error.message;
      continue;
    }

    const token = data.properties?.hashed_token;
    if (!token) continue;

    const confirmUrl = buildAuthConfirmUrl(siteUrl, token, input.linkType, nextPath);
    const result = await input.sendEmail(input.email, confirmUrl);
    if (result.sent) return result;
    lastError = result.resendError;
  }

  return { sent: false, resendError: lastError ?? "Could not generate a confirmation link." };
}

async function sendViaSupabaseFallback(
  input: DeliverAuthLinkEmailInput,
): Promise<AuthEmailDeliveryResult> {
  if (!input.supabaseFallback) {
    return { sent: false, supabaseError: "Supabase fallback is not available for this email type." };
  }

  const siteUrl = getSiteUrl();
  const nextPath = input.nextPath ?? "/dashboard";
  let lastError: string | undefined;

  for (const redirectTo of buildRedirectCandidates(siteUrl, nextPath, input.linkType)) {
    const { error } = await input.supabaseFallback(redirectTo);
    if (!error) {
      return { sent: true };
    }

    lastError = error;
    if (!isRedirectUrlError(error)) {
      break;
    }
  }

  return { sent: false, supabaseError: lastError };
}

export async function deliverAuthLinkEmail(
  input: DeliverAuthLinkEmailInput,
): Promise<AuthEmailDeliveryResult> {
  const resendResult = await sendViaResendApi(input);
  if (resendResult.sent) return resendResult;

  const supabaseResult = await sendViaSupabaseFallback(input);
  if (supabaseResult.sent) return supabaseResult;

  return {
    sent: false,
    resendError: resendResult.resendError,
    supabaseError: supabaseResult.supabaseError,
  };
}

export async function deliverSignupConfirmationEmail(email: string): Promise<AuthEmailDeliveryResult> {
  const { sendSignupConfirmationEmail } = await import("@/lib/email/send");

  return deliverAuthLinkEmail({
    email,
    linkType: "magiclink",
    nextPath: SIGNUP_EMAIL_VERIFY_NEXT,
    sendEmail: async (to, confirmUrl) => {
      const result = await sendSignupConfirmationEmail({ to, confirmUrl });
      return result.ok ? { sent: true } : { sent: false, resendError: result.error };
    },
    supabaseFallback: async (redirectTo) => {
      const supabase = await createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectTo },
      });
      return { error: error?.message };
    },
  });
}

export async function deliverEmailChangeConfirmation(input: {
  email: string;
  newEmail: string;
}): Promise<AuthEmailDeliveryResult> {
  const { sendEmailChangeConfirmationEmail } = await import("@/lib/email/send");

  return deliverAuthLinkEmail({
    email: input.email,
    linkType: "email_change_new",
    newEmail: input.newEmail,
    nextPath: "/dashboard/settings",
    sendEmail: async (to, confirmUrl) => {
      const result = await sendEmailChangeConfirmationEmail({
        to,
        confirmUrl,
        newEmail: input.newEmail,
      });
      return result.ok ? { sent: true } : { sent: false, resendError: result.error };
    },
    supabaseFallback: async (redirectTo) => {
      const supabase = await createClient();
      const { error } = await supabase.auth.resend({
        type: "email_change",
        email: input.email,
        options: { emailRedirectTo: redirectTo },
      });
      return { error: error?.message };
    },
  });
}
