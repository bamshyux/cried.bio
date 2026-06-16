export {
  buildAuthEmailErrorMessage as buildPasswordResetErrorMessage,
  getAuthEmailDeliveryStatus as getPasswordResetDeliveryStatus,
  isEmailDeliveryError,
  isRedirectUrlError,
  buildAuthConfirmUrl,
} from "@/lib/auth/auth-email-shared";

import { buildAuthConfirmUrl } from "@/lib/auth/auth-email-shared";

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
