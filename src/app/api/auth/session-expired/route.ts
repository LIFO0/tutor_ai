import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { getCurrentUser } from "@/lib/current-user";
import { loginPathWithNext, sanitizeNextPath } from "@/lib/safe-next";

/**
 * Выход из «протухшей» сессии без петли редиректов (см. redirectToLoginForInvalidSession).
 * Cookie стираем только если сессия действительно невалидна: так сторонняя ссылка на этот
 * адрес не может разлогинить пользователя с рабочей сессией.
 */
export async function GET(req: Request) {
  const nextParam = new URL(req.url).searchParams.get("next");
  const user = await getCurrentUser();
  if (user) {
    return NextResponse.redirect(new URL(sanitizeNextPath(nextParam) ?? "/dashboard", req.url));
  }
  await clearAuthCookie();
  return NextResponse.redirect(new URL(loginPathWithNext(nextParam), req.url));
}
