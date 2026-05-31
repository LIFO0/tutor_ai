"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readCookieConsent,
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
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setConsent(readCookieConsent());
    setIsReady(true);
  }, []);

  const acceptAll = useCallback(() => {
    writeCookieConsent("all");
    setConsent("all");
  }, []);

  const acceptEssentialOnly = useCallback(() => {
    writeCookieConsent("essential");
    setConsent("essential");
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
