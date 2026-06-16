import { getResendClient } from "@/lib/email/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailOtpType } from "@supabase/supabase-js";

export type AuthLinkType =
  | "signup"
  | "recovery"
  | "magiclink"
  | "email_change_current"
  | "email_change_new";

export type AuthEmailDeliveryResult = {
  sent: boolean;
  resendError?: string;
  supabaseError?: string;
};

export function getAuthEmailDeliveryStatus() {
  return {
    hasAdmin: Boolean(createAdminClient()),
    hasResend: Boolean(getResendClient()),
  };
}

export function isEmailDeliveryError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("confirmation email") ||
    lower.includes("recovery email") ||
    lower.includes("error sending") ||
    lower.includes("unable to send") ||
    lower.includes("smtp") ||
    lower.includes("email rate limit")
  );
}

export function isRedirectUrlError(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("redirect") && lower.includes("url");
}

export function buildRedirectCandidates(siteUrl: string, nextPath: string) {
  const encodedNext = encodeURIComponent(nextPath);
  return [
    `${siteUrl}/auth/callback?next=${encodedNext}`,
    `${siteUrl}/auth/confirm?next=${encodedNext}`,
    `${siteUrl}/auth/callback`,
  ];
}

export function authLinkTypeToOtpType(linkType: AuthLinkType): EmailOtpType {
  if (linkType === "recovery") return "recovery";
  if (linkType === "signup") return "signup";
  if (linkType === "magiclink") return "email";
  return "email_change";
}

export function buildAuthConfirmUrl(
  siteUrl: string,
  tokenHash: string,
  linkType: AuthLinkType,
  nextPath: string,
) {
  const type = authLinkTypeToOtpType(linkType);
  return `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(nextPath)}`;
}

export function buildAuthEmailErrorMessage(input: {
  purpose: "signup" | "password_reset" | "email_change";
  resendError?: string;
  supabaseError?: string;
}): string {
  const { hasAdmin, hasResend } = getAuthEmailDeliveryStatus();
  const intro =
    input.purpose === "signup"
      ? "We couldn't send your confirmation email."
      : input.purpose === "email_change"
        ? "We couldn't send your email change confirmation."
        : "We couldn't send a reset email.";

  const lines: string[] = [intro];

  if (!hasAdmin && !hasResend) {
    lines.push(
      "Add RESEND_API_KEY and SUPABASE_SERVICE_ROLE_KEY to your hosting env (e.g. Vercel → Settings → Environment Variables), then redeploy.",
    );
    return lines.join(" ");
  }

  if (hasAdmin && !hasResend) {
    lines.push(
      "RESEND_API_KEY is missing on the server. Add it in Vercel/hosting env and redeploy.",
    );
  }

  if (hasResend && input.resendError) {
    lines.push(`Resend: ${input.resendError}.`);
    const lower = input.resendError.toLowerCase();
    if (lower.includes("domain") || lower.includes("testing emails") || lower.includes("verify a domain")) {
      lines.push(
        "Verify cried.bio at resend.com/domains (add DNS records). Until then, emails only reach the address on your Resend account.",
      );
    }
  }

  if (input.supabaseError && isRedirectUrlError(input.supabaseError)) {
    lines.push(
      "Add https://cried.bio/** and http://localhost:3000/** under Supabase → Authentication → URL Configuration → Redirect URLs.",
    );
  } else if (input.supabaseError && isEmailDeliveryError(input.supabaseError)) {
    lines.push(
      "Supabase email delivery failed — check Custom SMTP in Supabase Dashboard → Authentication → SMTP.",
    );
  } else if (input.supabaseError) {
    lines.push(input.supabaseError);
  }

  if (lines.length === 1) {
    lines.push("Check Supabase Auth email/SMTP settings and your Resend domain, then try again.");
  }

  return lines.join(" ");
}
