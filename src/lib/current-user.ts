import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

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
};

async function readCurrentUser(): Promise<CurrentUser | null> {
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
      })
      .from(schema.users)
      .where(eq(schema.users.id, payload.userId))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Один запрос к БД на RSC-рендер даже если layout и page оба вызывают getCurrentUser. */
export const getCurrentUser = cache(readCurrentUser);

