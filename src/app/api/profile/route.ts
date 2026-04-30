import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { getDb, schema } from "@/lib/db";
import { signAuthToken, setAuthCookie } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  return NextResponse.json({ ok: true, user });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const body = (await req.json().catch(() => null)) as
    | { name?: string; grade?: number; avatar?: string }
    | null;

  const name = body?.name?.trim();
  const grade = body?.grade === undefined ? undefined : Number(body.grade);
  const avatar = body?.avatar?.trim();

  const patch: Partial<{ name: string; grade: number; avatar: string }> = {};
  if (name !== undefined) {
    if (!name) return jsonError("Имя не может быть пустым.", 400);
    patch.name = name;
  }
  if (grade !== undefined) {
    if (!Number.isInteger(grade) || grade < 5 || grade > 11) {
      return jsonError("Класс должен быть от 5 до 11.", 400);
    }
    patch.grade = grade;
  }
  if (avatar !== undefined) {
    if (!avatar) return jsonError("Аватар не может быть пустым.", 400);
    patch.avatar = avatar;
  }

  if (Object.keys(patch).length === 0) {
    return jsonError("Нет изменений.", 400);
  }

  const db = getDb();
  await db.update(schema.users).set(patch).where(eq(schema.users.id, user.id));

  const newGrade = patch.grade ?? user.grade;
  const token = await signAuthToken({ userId: user.id, grade: newGrade });
  await setAuthCookie(token);

  return NextResponse.json({ ok: true });
}

