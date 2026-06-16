import {
  buildAuthConfirmUrl,
  isEmailDeliveryError,
  isRedirectUrlError,
  type AuthEmailDeliveryResult,
} from "@/lib/auth/auth-email-shared";
import { deliverAuthLinkEmail } from "@/lib/auth/deliver-auth-link-email";
import { sendPasswordResetEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export type PasswordResetSendResult = AuthEmailDeliveryResult;

export {
  buildAuthEmailErrorMessage as buildPasswordResetErrorMessage,
  getAuthEmailDeliveryStatus as getPasswordResetDeliveryStatus,
  isEmailDeliveryError,
  isRedirectUrlError,
} from "@/lib/auth/auth-email-shared";

export function buildPasswordResetRedirect(siteUrl: string) {
  const nextPath = "/auth/update-password";
  return {
    nextPath,
    redirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent(nextPath)}`,
    confirmUrl(tokenHash: string) {
      return buildAuthConfirmUrl(siteUrl, tokenHash, "recovery", nextPath);
    },
  };
}

/** Attempt every configured delivery path for password reset email. */
export async function deliverPasswordResetEmail(email: string): Promise<PasswordResetSendResult> {
  return deliverAuthLinkEmail({
    email,
    linkType: "recovery",
    nextPath: "/auth/update-password",
    sendEmail: async (to, confirmUrl) => {
      const result = await sendPasswordResetEmail({ to, resetUrl: confirmUrl });
      return result.ok ? { sent: true } : { sent: false, resendError: result.error };
    },
    supabaseFallback: async (redirectTo) => {
      const supabase = await createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      return { error: error?.message };
    },
  });
}

export function isRecoverableSupabaseOnlyError(message?: string) {
  if (!message) return false;
  return isEmailDeliveryError(message) || isRedirectUrlError(message);
}
