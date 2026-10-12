"use client";

import Link from "next/link";
import { useCookieConsent } from "@/components/cookie/CookieConsentProvider";

export function CookieBanner() {
  const { consent, isReady, acceptAll, acceptEssentialOnly } = useCookieConsent();

  if (!isReady || consent !== null) return null;

  return (
    <div
      role="region"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
      className="fixed inset-x-2 bottom-2 z-50 rounded-2xl border border-border bg-card shadow-[0_4px_24px_rgba(0,0,0,0.12)] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-xl"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-4 sm:py-3">
        <p id="cookie-banner-title" className="sr-only">
          Согласие на использование cookie
        </p>
        <p
          id="cookie-banner-description"
          className="min-w-0 flex-1 basis-48 text-xs leading-snug text-muted-foreground sm:text-sm"
        >
          Мы используем cookie для работы сайта и аналитики.{" "}
          <Link
            href="/privacy"
            className="text-[color:var(--color-accent)] underline underline-offset-2"
          >
            Подробнее
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={acceptEssentialOnly}
            className="inline-flex h-8 items-center justify-center rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted sm:text-sm"
          >
            Только нужные
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="inline-flex h-8 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-4 text-xs font-medium text-white transition-opacity hover:opacity-90 sm:text-sm"
          >
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}
