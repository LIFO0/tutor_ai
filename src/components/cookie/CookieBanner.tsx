"use client";

import Link from "next/link";
import { useCookieConsent } from "@/components/cookie/CookieConsentProvider";

export function CookieBanner() {
  const { consent, isReady, acceptAll, acceptEssentialOnly } = useCookieConsent();

  if (!isReady || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-5 lg:px-8">
        <div className="min-w-0 flex-1">
          <p id="cookie-banner-title" className="sr-only">
            Согласие на использование cookie
          </p>
          <p
            id="cookie-banner-description"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            Сервис использует обязательные cookie для входа и работы учётной записи, а также
            аналитические cookie (Яндекс.Метрика) для улучшения Сервиса. Подробнее — в{" "}
            <Link
              href="/privacy"
              className="text-[color:var(--color-accent)] underline-offset-2 hover:underline"
            >
              Политике конфиденциальности
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={acceptEssentialOnly}
            className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Только необходимые
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--color-accent)] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}
