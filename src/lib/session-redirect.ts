import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sanitizeNextPath } from "@/lib/safe-next";

/** Заголовок с путём+query текущего запроса; ставит proxy (middleware.ts), клиентский затирается. */
export const REQUEST_PATH_HEADER = "x-mz-request-path";

/**
 * Сессия не прошла проверку в БД (пользователь удалён, сменился session_version), хотя JWT в
 * cookie ещё валиден и proxy его пропускает. Просто redirect("/login") зациклится: proxy видит
 * «валидный» cookie на /login и шлёт обратно на /dashboard. Поэтому идём через
 * /api/auth/session-expired: он стирает cookie и ведёт на /login?next=<текущий путь>.
 */
export async function redirectToLoginForInvalidSession(): Promise<never> {
  const h = await headers();
  const next = sanitizeNextPath(h.get(REQUEST_PATH_HEADER));
  redirect(
    next ? `/api/auth/session-expired?next=${encodeURIComponent(next)}` : "/api/auth/session-expired",
  );
}
