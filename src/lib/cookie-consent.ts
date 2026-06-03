export const COOKIE_CONSENT_KEY = "mishka_cookie_consent";

export type CookieConsent = "all" | "essential";

const listeners = new Set<() => void>();

function notifyCookieConsentChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeCookieConsent(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStoreChange);
  }
  return () => {
    listeners.delete(onStoreChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStoreChange);
    }
  };
}

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === "all" || value === "essential") return value;
  return null;
}

export function writeCookieConsent(value: CookieConsent): void {
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
  notifyCookieConsentChange();
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent() === "all";
}
