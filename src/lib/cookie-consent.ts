export const COOKIE_CONSENT_KEY = "mishka_cookie_consent";

export type CookieConsent = "all" | "essential";

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === "all" || value === "essential") return value;
  return null;
}

export function writeCookieConsent(value: CookieConsent): void {
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent() === "all";
}
