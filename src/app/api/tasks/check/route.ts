import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { getTask, setTaskCheckResult } from "@/lib/tasks";
import { taskCheckPrompt } from "@/lib/prompts";
import { completeOnce } from "@/lib/llm";
import { resolveTaskCheckResult } from "@/lib/task-check-json";
import { answersMatchForTask } from "@/lib/answer-normalize";
import { quotaErrorResponse } from "@/lib/api/quota-response";
import { assertYandexLlmConfigured } from "@/lib/llm-config";
import { checkAndConsume, toQuotaUser } from "@/lib/usage-quota";

const TASK_CHECK_SYSTEM_PROMPT =
  "Ты — добрый репетитор. Пиши по-русски, используй LaTeX при необходимости.\n" +
  "Верни ответ СТРОГО в JSON формате:\n" +
  '{ "correct": true|false, "feedback": "..." }\n' +
  "Поле correct обязательно: true — ответ верный, false — неверный. Вердикт только через correct, не только словами в feedback.\n" +
  "Без markdown, без пояснений вокруг JSON. Поле \"feedback\" — текст для ученика.\n" +
  "Поле feedback — не длиннее 800 символов, до 6 шагов. Принимай ответы с тем же результатом, даже если они записаны по-другому. В feedback — простой язык для школьника.";

const TASK_CHECK_RETRY_SYSTEM_PROMPT =
  TASK_CHECK_SYSTEM_PROMPT +
  "\nВажно: верни только валидный JSON с полями correct и feedback, без обрезки строки feedback.";

async function runTaskCheckLlm(params: {
  taskText: string;
  correctAnswer: string;
  userAnswer: string;
  systemText: string;
  maxTokens: number;
}) {
  return completeOnce({
    messages: [
      { role: "system", text: params.systemText },
      {
        role: "user",
        text: taskCheckPrompt({
          taskText: params.taskText,
          correctAnswer: params.correctAnswer,
          userAnswer: params.userAnswer,
        }),
      },
    ],
    temperature: 0.3,
    maxTokens: params.maxTokens,
  });
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

  const llmGuard = assertYandexLlmConfigured();
  if (llmGuard) return llmGuard;

  const quota = await checkAndConsume(toQuotaUser(user), "task_check");
  if (!quota.ok) return quotaErrorResponse(quota);

  const correctAnswer = task.correctAnswer ?? "";
  const deterministicCorrect = answersMatchForTask(userAnswer, correctAnswer);

  let modelRaw = await runTaskCheckLlm({
    taskText: task.taskText,
    correctAnswer,
    userAnswer,
    systemText: TASK_CHECK_SYSTEM_PROMPT,
    maxTokens: 1500,
  });

  let resolved = resolveTaskCheckResult(modelRaw);

  if (!resolved.parseOk) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[tasks/check] parse failed, retrying", {
        taskId,
        modelRawLen: modelRaw.length,
        preview: modelRaw.slice(0, 200),
      });
    }
    modelRaw = await runTaskCheckLlm({
      taskText: task.taskText,
      correctAnswer,
      userAnswer,
      systemText: TASK_CHECK_RETRY_SYSTEM_PROMPT,
      maxTokens: 1200,
    });
    resolved = resolveTaskCheckResult(modelRaw);
  }

  const modelSaysCorrect = resolved.correct === true;
  const feedbackText = resolved.feedbackText;

  await setTaskCheckResult({
    userId: user.id,
    taskId,
    userAnswer,
    correct: deterministicCorrect || modelSaysCorrect,
    aiFeedback: feedbackText,
  });

  const correct = deterministicCorrect || modelSaysCorrect;
  return NextResponse.json({ ok: true, correct, aiFeedback: feedbackText });
}
