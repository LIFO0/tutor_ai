import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { assertProductionEnv } from "@/lib/llm-config";
import { isAdminEmail } from "@/lib/feedback";

/** Проверка сессии по JWT в cookie без запроса к БД (для публичной шапки). */
export async function isUserAuthenticated(): Promise<boolean> {
  const c = await cookies();
  const token = c.get(authCookieName)?.value;
  if (!token) return false;
  try {
    await verifyAuthToken(token);
    return true;
  } catch {
    return false;
  }
}

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  grade: number;
  avatar: string;
  chatName: string | null;
  plan: string;
  planExpiresAt: string | null;
  /**
   * Email в ADMIN_EMAILS и аккаунт привязан к Яндексу (Яндекс подтвердил владение почтой).
   * Одного совпадения email мало: при регистрации по паролю почта не проверяется (аудит H2).
   */
  isAdmin: boolean;
  sessionVersion: number;
};

async function readCurrentUser(): Promise<CurrentUser | null> {
  assertProductionEnv();
  const db = getDb();
  const c = await cookies();
  const token = c.get(authCookieName)?.value;
  if (!token) return null;

  try {
    const payload = await verifyAuthToken(token);
    const rows = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        grade: schema.users.grade,
        avatar: schema.users.avatar,
        chatName: schema.users.chatName,
        plan: schema.users.plan,
        planExpiresAt: schema.users.planExpiresAt,
        yandexId: schema.users.yandexId,
        sessionVersion: schema.users.sessionVersion,
      })
      .from(schema.users)
      .where(eq(schema.users.id, payload.userId))
      .limit(1);
    const row = rows[0];
    if (!row || row.sessionVersion !== payload.sv) return null;
    const { yandexId, ...user } = row;
    return { ...user, isAdmin: Boolean(yandexId) && isAdminEmail(row.email) };
  } catch {
    return null;
  }
}

/** Один запрос к БД на RSC-рендер даже если layout и page оба вызывают getCurrentUser. */
export const getCurrentUser = cache(readCurrentUser);

