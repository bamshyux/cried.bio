import { buildAuthConfirmUrl, PASSWORD_RESET_NEXT } from "@/lib/auth/auth-email-shared";

export function buildPasswordResetRedirect(siteUrl: string) {
  const nextPath = PASSWORD_RESET_NEXT;
  return {
    nextPath,
    redirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent(nextPath)}`,
    confirmUrl(tokenHash: string) {
      return buildAuthConfirmUrl(siteUrl, tokenHash, "recovery", nextPath);
    },
  };
}
