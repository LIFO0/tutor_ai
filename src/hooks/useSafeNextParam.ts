"use client";

import { useEffect, useState } from "react";
import { sanitizeNextPath } from "@/lib/safe-next";

/**
 * Безопасный `?next=` текущей страницы (или null). Читаем после монтирования из
 * window.location, чтобы не требовать Suspense для useSearchParams и не ломать гидрацию.
 */
export function useSafeNextParam(): string | null {
  const [next, setNext] = useState<string | null>(null);
  useEffect(() => {
    const id = window.setTimeout(() => {
      setNext(sanitizeNextPath(new URLSearchParams(window.location.search).get("next")));
    }, 0);
    return () => window.clearTimeout(id);
  }, []);
  return next;
}

/** То же, синхронно — для обработчиков событий. */
export function readSafeNextParam(): string | null {
  if (typeof window === "undefined") return null;
  return sanitizeNextPath(new URLSearchParams(window.location.search).get("next"));
}
