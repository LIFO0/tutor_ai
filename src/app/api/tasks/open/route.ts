import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { openTaskByPublicId } from "@/lib/task-bank";
import { quotaErrorResponse } from "@/lib/api/quota-response";
import { checkAndConsume, toQuotaUser } from "@/lib/usage-quota";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code?.trim() ?? "";
  if (!code) return jsonError("Введите код задания.", 400);
  if (code.length > 32) return jsonError("Код слишком длинный.", 400);

  const quota = await checkAndConsume(toQuotaUser(user), "task_open");
  if (!quota.ok) return quotaErrorResponse(quota);

  const result = await openTaskByPublicId(user.id, code);
  if (!result) return jsonError("Задание с таким кодом не найдено.", 404);

  return NextResponse.json({
    ok: true,
    taskId: result.sessionId,
    publicId: result.publicId,
  });
}
