import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { signAuthToken, setAuthCookie } from "@/lib/auth";
import { jsonError } from "@/lib/api/auth";
import { getDb, schema } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { checkIpRateLimit } from "@/lib/rate-limit-ip";

export async function POST(req: Request) {
  const limited = checkIpRateLimit(req, "auth-register", 15, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Слишком много регистраций с этого адреса. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const db = getDb();
  const body = (await req.json().catch(() => null)) as
    | {
        name?: string;
        email?: string;
        password?: string;
        grade?: number;
        avatar?: string;
        acceptedPrivacyPolicy?: boolean;
      }
    | null;

  if (body?.acceptedPrivacyPolicy !== true) {
    return jsonError(
      "Необходимо согласие с Политикой конфиденциальности.",
      400,
    );
  }

  const name = body?.name?.trim();
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  const grade = Number(body?.grade);
  const avatar = body?.avatar?.trim() || "bear1";

  if (!name || !email || !password) return jsonError("Заполните все поля.", 400);
  if (!email.includes("@")) return jsonError("Некорректный email.", 400);
  if (password.length < 6) return jsonError("Пароль слишком короткий.", 400);
  if (!Number.isInteger(grade) || grade < 5 || grade > 11) {
    return jsonError("Класс должен быть от 5 до 11.", 400);
  }

  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (existing.length) return jsonError("Этот email уже зарегистрирован.", 409);

  const passwordHash = await hashPassword(password);
  const inserted = await db
    .insert(schema.users)
    .values({ name, email, password: passwordHash, grade, avatar })
    .returning({ id: schema.users.id, grade: schema.users.grade });

  const userId = inserted[0]?.id;
  if (!userId) return jsonError("Не удалось создать пользователя.", 500);

  const token = await signAuthToken({ userId, grade });
  await setAuthCookie(token);

  return NextResponse.json({ ok: true });
}

