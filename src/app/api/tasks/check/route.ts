import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { getTask, setTaskCheckResult } from "@/lib/tasks";
import { taskCheckPrompt } from "@/lib/prompts";
import { completeOnce } from "@/lib/llm";

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    return null;
  }
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

  const modelRaw = await completeOnce({
    messages: [
      {
        role: "system",
        text:
          "Ты — добрый репетитор. Пиши по-русски, используй LaTeX при необходимости.\n" +
          "Верни ответ СТРОГО в JSON формате:\n" +
          '{ "correct": true|false, "feedback": "..." }\n' +
          'Без markdown, без пояснений вокруг JSON. Поле "feedback" — текст для ученика.',
      },
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

  const parsed = extractJsonObject(modelRaw);
  const parsedCorrect =
    typeof parsed === "object" &&
    parsed !== null &&
    "correct" in parsed &&
    typeof (parsed as { correct?: unknown }).correct === "boolean"
      ? (parsed as { correct: boolean }).correct
      : null;
  const parsedFeedback =
    typeof parsed === "object" &&
    parsed !== null &&
    "feedback" in parsed &&
    typeof (parsed as { feedback?: unknown }).feedback === "string"
      ? (parsed as { feedback: string }).feedback
      : null;

  // Fallback if model didn't follow JSON format.
  const fallbackModelSaysCorrect =
    /\b(верно|верен|верна|верное|верны|правильно|правильный ответ|ответ верный|молодец)\b/i.test(
      modelRaw,
    );
  const modelSaysCorrect = parsedCorrect ?? fallbackModelSaysCorrect;
  const feedback = (parsedFeedback ?? modelRaw).trim();

  await setTaskCheckResult({
    userId: user.id,
    taskId,
    userAnswer,
    correct: naiveCorrect || modelSaysCorrect,
    aiFeedback: feedback,
  });

  const correct = naiveCorrect || modelSaysCorrect;
  return NextResponse.json({ ok: true, correct, aiFeedback: feedback });
}

