"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  readCookieConsent,
  subscribeCookieConsent,
  writeCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";

type CookieConsentContextValue = {
  consent: CookieConsent | null;
  isReady: boolean;
  acceptAll: () => void;
  acceptEssentialOnly: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const consent = useSyncExternalStore(
    subscribeCookieConsent,
    readCookieConsent,
    () => null,
  );
  const isReady = useSyncExternalStore(
    subscribeCookieConsent,
    () => true,
    () => false,
  );

  const acceptAll = useCallback(() => {
    writeCookieConsent("all");
  }, []);

  const acceptEssentialOnly = useCallback(() => {
    writeCookieConsent("essential");
  }, []);

  const value = useMemo(
    () => ({ consent, isReady, acceptAll, acceptEssentialOnly }),
    [consent, isReady, acceptAll, acceptEssentialOnly],
  );

  return (
    <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return context;
}
