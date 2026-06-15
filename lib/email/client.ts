import { Resend } from "resend";

let resend: Resend | null | undefined;

export function getResendClient(): Resend | null {
  if (resend !== undefined) return resend;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not set; emails will not be sent.");
    resend = null;
    return null;
  }

  resend = new Resend(apiKey);
  return resend;
}
