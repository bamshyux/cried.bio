import { getRequestMeta } from "@/lib/data/account-settings";
import {
  assertHumanVerified,
  hashForRateLimit,
} from "@/lib/security/human-verification";
import { isHumanVerificationRequired } from "@/lib/security/human-verification-messages";
import { assertIpRateLimit, assertRateLimit, assertUserRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

export type HumanVerificationRedirectFrom = "login" | "signup" | "password_reset";

export function redirectIfHumanVerificationRequired(
  error: string | null,
  _from: HumanVerificationRedirectFrom,
): string | null {
  if (error && isHumanVerificationRequired(error)) {
    return error;
  }
  return error;
}

export async function guardSensitiveAction(options: {
  scope: "login" | "signup" | "password_reset" | "guestbook" | "follow" | "theme_publish";
  userId?: string;
  email?: string;
  requireHuman?: boolean;
}): Promise<string | null> {
  if (options.requireHuman !== false) {
    const humanError = await assertHumanVerified();
    if (humanError) return humanError;
  }

  const { ip_address: ip } = await getRequestMeta();

  switch (options.scope) {
    case "login":
      return assertIpRateLimit("login", ip, RATE_LIMITS.loginIp);
    case "signup":
      return assertIpRateLimit("signup", ip, RATE_LIMITS.signupIp);
    case "password_reset": {
      const ipError = await assertIpRateLimit("password_reset", ip, RATE_LIMITS.passwordResetIp);
      if (ipError) return ipError;
      if (options.email) {
        return assertRateLimitEmail("password_reset", options.email, RATE_LIMITS.passwordResetEmail);
      }
      return null;
    }
    case "guestbook":
      if (!options.userId) return "You must be logged in.";
      return assertUserRateLimit("guestbook", options.userId, RATE_LIMITS.guestbookUserHourly);
    case "follow":
      if (!options.userId) return "You must be logged in.";
      return assertUserRateLimit("follow", options.userId, RATE_LIMITS.followUserHourly);
    case "theme_publish":
      if (!options.userId) return "You must be logged in.";
      return assertUserRateLimit("theme_publish", options.userId, RATE_LIMITS.themePublishHourly);
    default:
      return null;
  }
}

async function assertRateLimitEmail(
  scope: string,
  email: string,
  config: { limit: number; windowMs: number },
): Promise<string | null> {
  return assertRateLimit(`${scope}:email:${hashForRateLimit(email)}`, config.limit, config.windowMs);
}
