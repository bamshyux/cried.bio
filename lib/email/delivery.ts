import { EMAIL_FROM, RESEND_SANDBOX_FROM } from "@/lib/email/constants";
import type { EmailSendResult } from "@/lib/email/send";

export function isResendDomainIssue(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("domain") ||
    lower.includes("not verified") ||
    lower.includes("from address") ||
    lower.includes("testing emails") ||
    lower.includes("verify a domain")
  );
}

/** Try primary sender, then Resend sandbox when cried.bio is not verified yet. */
export async function sendWithFromFallback(
  send: (from: string) => Promise<EmailSendResult>,
): Promise<EmailSendResult> {
  const primary = await send(EMAIL_FROM);
  if (primary.ok) return primary;

  if (isResendDomainIssue(primary.error) && EMAIL_FROM !== RESEND_SANDBOX_FROM) {
    const fallback = await send(RESEND_SANDBOX_FROM);
    if (fallback.ok) return fallback;
    return fallback;
  }

  return primary;
}
