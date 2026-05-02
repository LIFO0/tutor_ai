import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  grade: number;
  avatar: string;
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

