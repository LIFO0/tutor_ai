import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { getTask, setTaskCheckResult } from "@/lib/tasks";
import { taskCheckPrompt } from "@/lib/prompts";
import { completeOnce } from "@/lib/llm";

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const body = (await req.json().catch(() => null)) as
    | { taskId?: number; userAnswer?: string }
    | null;
  const taskId = Number(body?.taskId);
  const userAnswer = body?.userAnswer?.trim() ?? "";
  if (!Number.isInteger(taskId)) return jsonError("Invalid taskId", 400);
  if (!userAnswer) return jsonError("Введите ответ.", 400);

  const task = await getTask(user.id, taskId);
  if (!task) return jsonError("Not found", 404);

  const correctAnswer = task.correctAnswer ?? "";
  const naiveCorrect =
    normalize(userAnswer) === normalize(correctAnswer) && normalize(correctAnswer) !== "—";

  const feedback = await completeOnce({
    messages: [
      { role: "system", text: "Ты — добрый репетитор. Пиши по-русски, используй LaTeX при необходимости." },
      {
        role: "user",
        text: taskCheckPrompt({
          taskText: task.taskText,
          correctAnswer: correctAnswer,
          userAnswer,
        }),
      },
    ],
    temperature: 0.3,
    maxTokens: 1000,
  });

  const modelSaysCorrect = /(^|\n)\s*(✅\s*)?(верно|правильно|молодец)\b/i.test(feedback);

  await setTaskCheckResult({
    userId: user.id,
    taskId,
    userAnswer,
    correct: naiveCorrect || modelSaysCorrect,
    aiFeedback: feedback.trim(),
  });

  const correct = naiveCorrect || modelSaysCorrect;
  return NextResponse.json({ ok: true, correct, aiFeedback: feedback.trim() });
}

