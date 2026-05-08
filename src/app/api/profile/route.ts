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
    | { name?: string; grade?: number; avatar?: string; chatName?: string | null }
    | null;

  const name = body?.name?.trim();
  const grade = body?.grade === undefined ? undefined : Number(body.grade);
  const avatar = body?.avatar?.trim();
  const chatNameRaw = body?.chatName;
  const chatName =
    chatNameRaw === undefined
      ? undefined
      : chatNameRaw === null || String(chatNameRaw).trim() === ""
        ? null
        : String(chatNameRaw).trim();

  const patch: Partial<{ name: string; grade: number; avatar: string; chatName: string | null }> =
    {};
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
    // Allow built-in avatars (bear1..bear4) and uploaded avatars under /uploads/avatars/.
    if (
      !/^bear[1-4]$/.test(avatar) &&
      !/^\/uploads\/avatars\/user-\d+\.png(\?v=\d+)?$/.test(avatar) &&
      !/^https:\/\/avatars\.yandex\.net\/get-yapic\/.+\/islands-(small|34|middle|50|retina-small|68|75|retina-middle|retina-50|200)$/.test(
        avatar,
      ) &&
      !/^https:\/\/.+/.test(avatar)
    ) {
      return jsonError("Некорректный аватар.", 400);
    }
    patch.avatar = avatar;
  }
  if (chatName !== undefined) {
    if (chatName && chatName.length > 80) {
      return jsonError("Обращение слишком длинное (макс. 80 символов).", 400);
    }
    patch.chatName = chatName;
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

