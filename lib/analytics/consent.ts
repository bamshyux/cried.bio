import type { CookieConsentLevel } from "@/lib/types/landing";

export const COOKIE_CONSENT_KEY = "bf_cookie_consent";

export function getCookieConsent(): CookieConsentLevel | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === "all" || value === "essential") return value;
  return null;
}

export function setCookieConsent(level: CookieConsentLevel): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COOKIE_CONSENT_KEY, level);
  window.dispatchEvent(new CustomEvent("bf-cookie-consent", { detail: level }));
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent() === "all";
}

/** Profile view counts are first-party, essential product behavior — not gated on marketing cookies. */
export function canRecordProfileView(): boolean {
  return true;
}

/** Link click analytics are first-party product metrics for profile owners. */
export function canRecordLinkClick(): boolean {
  return true;
}
