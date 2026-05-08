import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { signAuthToken, setAuthCookie } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const TEST_USER = {
  email: "test@medvejonok.local",
  password: "test1234",
  name: "Тестовый ученик",
  grade: 7,
  avatar: "bear1",
} as const;

export async function POST() {
  const db = getDb();
  const allowInProd =
    process.env.ALLOW_TEST_LOGIN === "true" ||
    process.env.ALLOW_TEST_LOGIN === "1" ||
    process.env.ALLOW_TEST_LOGIN === "yes";

  if (process.env.NODE_ENV === "production" && !allowInProd) {
    return jsonError("Not available in production", 404);
  }

  const existing = await db
    .select({ id: schema.users.id, grade: schema.users.grade })
    .from(schema.users)
    .where(eq(schema.users.email, TEST_USER.email))
    .limit(1);

  let userId = existing[0]?.id;
  let grade = existing[0]?.grade ?? TEST_USER.grade;

  if (!userId) {
    const passwordHash = await hashPassword(TEST_USER.password);
    const inserted = await db
      .insert(schema.users)
      .values({
        email: TEST_USER.email,
        password: passwordHash,
        name: TEST_USER.name,
        grade: TEST_USER.grade,
        avatar: TEST_USER.avatar,
      })
      .returning({ id: schema.users.id, grade: schema.users.grade });

    userId = inserted[0]?.id;
    grade = inserted[0]?.grade ?? TEST_USER.grade;
  }

  if (!userId) return jsonError("Failed to create test user", 500);

  const token = await signAuthToken({ userId, grade });
  await setAuthCookie(token);

  return NextResponse.json({ ok: true });
}

