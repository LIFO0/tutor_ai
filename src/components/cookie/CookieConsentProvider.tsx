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
  const [state, setState] = useState<{ ready: boolean; consent: CookieConsent | null }>({
    ready: false,
    consent: null,
  });

  useEffect(() => {
    const sync = () => setState({ ready: true, consent: readCookieConsent() });
    sync();
    return subscribeCookieConsent(sync);
  }, []);

  const acceptAll = useCallback(() => {
    writeCookieConsent("all");
  }, []);

  const acceptEssentialOnly = useCallback(() => {
    writeCookieConsent("essential");
  }, []);

  const value = useMemo(
    () => ({
      consent: state.consent,
      isReady: state.ready,
      acceptAll,
      acceptEssentialOnly,
    }),
    [state.consent, state.ready, acceptAll, acceptEssentialOnly],
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
