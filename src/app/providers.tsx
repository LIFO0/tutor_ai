"use client";

import { Suspense } from "react";
import { YandexMetrika } from "@/components/analytics/YandexMetrika";
import { CookieBanner } from "@/components/cookie/CookieBanner";
import { CookieConsentProvider } from "@/components/cookie/CookieConsentProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CookieConsentProvider>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <CookieBanner />
      <Suspense fallback={null}>
        <YandexMetrika />
      </Suspense>
    </CookieConsentProvider>
  );
}
