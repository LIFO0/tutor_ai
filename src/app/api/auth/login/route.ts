import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { signAuthToken, setAuthCookie } from "@/lib/auth";
import { jsonError } from "@/lib/api/auth";
import { getDb, schema } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { checkIpRateLimit } from "@/lib/rate-limit-ip";

export async function POST(req: Request) {
  const limited = checkIpRateLimit(req, "auth-login", 40, 10 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Слишком много попыток входа. Подождите немного." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const db = getDb();
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";

  if (!email || !password) return jsonError("Введите email и пароль.", 400);

  const user = await db
    .select({
      id: schema.users.id,
      password: schema.users.password,
      grade: schema.users.grade,
    })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  const found = user[0];
  if (!found) return jsonError("Неверный email или пароль.", 401);
  if (!found.password) {
    return jsonError("Этот аккаунт создан через Яндекс. Войдите через Яндекс.", 400);
  }

  const ok = await verifyPassword(password, found.password);
  if (!ok) return jsonError("Неверный email или пароль.", 401);

  const token = await signAuthToken({ userId: found.id, grade: found.grade });
  await setAuthCookie(token);

  return NextResponse.json({ ok: true });
}

