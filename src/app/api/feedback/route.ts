import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { FEEDBACK_DAILY_LIMIT, validateFeedback } from "@/lib/feedback";
import {
  countFeedbackToday,
  deleteFeedbackScreenshot,
  insertFeedback,
  saveFeedbackScreenshot,
} from "@/lib/feedback-server";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Войди в аккаунт, чтобы написать нам.", 401);

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("Не получилось прочитать форму.", 400);

  const fileRaw = form.get("screenshot");
  const file = fileRaw instanceof File && fileRaw.size > 0 ? fileRaw : null;
  const v = validateFeedback({
    topic: form.get("topic"),
    text: form.get("text"),
    screenshot: file ? { size: file.size, type: file.type } : null,
  });
  if (!v.ok) return jsonError(v.error, 400);

  if (countFeedbackToday(user.id) >= FEEDBACK_DAILY_LIMIT) {
    return jsonError(
      `Сегодня ты уже отправил ${FEEDBACK_DAILY_LIMIT} сообщений — спасибо! Новые можно будет отправить завтра.`,
      429,
    );
  }

  let screenshotKey: string | null = null;
  if (file) {
    try {
      screenshotKey = await saveFeedbackScreenshot(Buffer.from(await file.arrayBuffer()));
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "Не получилось сохранить скриншот.", 400);
    }
  }

  const pageUrl = form.get("pageUrl");
  try {
    const id = insertFeedback({
      userId: user.id,
      topic: v.topic,
      text: v.text,
      screenshotKey,
      pageUrl: typeof pageUrl === "string" ? pageUrl.slice(0, 500) : null,
      userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    });
    return NextResponse.json({ ok: true, id });
  } catch {
    if (screenshotKey) await deleteFeedbackScreenshot(screenshotKey);
    return jsonError("Что-то пошло не так. Попробуй ещё раз чуть позже.", 500);
  }
}
