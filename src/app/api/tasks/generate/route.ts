import { NextResponse } from "next/server";
import { isSchoolSubject, type SchoolSubject, type Subject } from "@/lib/subjects";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { taskGeneratePrompt } from "@/lib/prompts";
import { completeOnce } from "@/lib/llm";
import { createTaskSession } from "@/lib/tasks";
import { quotaErrorResponse } from "@/lib/api/quota-response";
import { assertYandexLlmConfigured } from "@/lib/llm-config";
import { checkAndConsume, getUsageSnapshot, toQuotaUser } from "@/lib/usage-quota";
import { getTaskBankMixRate } from "@/lib/task-bank-config";
import {
  findUnseenBankTask,
  recentSolvedTemplates,
  templateHashOf,
  upsertBankTask,
  userSolvedTemplate,
} from "@/lib/task-bank";
import { isValidTopicKey, resolveTopicKey } from "@/lib/task-topics";

function parseTask(text: string) {
  const mTopicKey = text.match(/ТЕМА_КЛЮЧ:\s*(.+)/i);
  const mSubtopic = text.match(/ПОДТЕМА:\s*(.+)/i);
  const mTask = text.match(/ЗАДАЧА:\s*([\s\S]*?)\n\s*ОТВЕТ:/i);
  const mAns = text.match(/ОТВЕТ:\s*([\s\S]*)$/i);
  const taskText = (mTask?.[1] ?? text).trim();
  const answer = (mAns?.[1] ?? "").trim();
  const topicKey = (mTopicKey?.[1] ?? "").trim();
  const subtopic = (mSubtopic?.[1] ?? "").trim();
  return {
    taskText,
    answer: answer || "—",
    topicKey: topicKey || null,
    subtopic: subtopic || null,
  };
}

async function serveFromBank(params: {
  userId: number;
  bank: Awaited<ReturnType<typeof findUnseenBankTask>>;
}) {
  const bank = params.bank!;
  const sessionId = await createTaskSession({
    userId: params.userId,
    subject: bank.subject as SchoolSubject,
    topic: bank.rawTopic,
    taskText: bank.taskText,
    correctAnswer: bank.correctAnswer,
    taskId: bank.id,
  });
  if (!sessionId) return jsonError("Failed to save task", 500);

  return NextResponse.json({
    ok: true,
    taskId: sessionId,
    taskText: bank.taskText,
    publicId: bank.publicId,
    fromBank: true,
  });
}

async function generateWithLlm(params: {
  subject: SchoolSubject;
  grade: number;
  topic: string;
  userId: number;
  topicKey: string;
  topicNorm: string;
  allowRetry: boolean;
}) {
  const avoidTemplates = await recentSolvedTemplates(params.userId, params.subject, 5);
  const prompt = taskGeneratePrompt({
    subject: params.subject,
    grade: params.grade,
    topic: params.topic,
    avoidTemplates,
  });

  const raw = await completeOnce({
    messages: [
      { role: "system", text: "Ты — генератор школьных задач. Отвечай строго по формату." },
      { role: "user", text: prompt },
    ],
    temperature: 0.4,
    maxTokens: 900,
  });

  const parsed = parseTask(raw);
  const aiTopicKey =
    parsed.topicKey && isValidTopicKey(params.subject, parsed.topicKey)
      ? parsed.topicKey
      : params.topicKey;

  const tHash = templateHashOf(parsed.taskText);
  if (params.allowRetry && (await userSolvedTemplate(params.userId, tHash))) {
    return generateWithLlm({ ...params, allowRetry: false });
  }

  const bank = await upsertBankTask({
    subject: params.subject,
    grade: params.grade,
    rawTopic: params.topic,
    topicKey: aiTopicKey,
    topicNorm: params.topicNorm,
    subtopic: parsed.subtopic,
    taskText: parsed.taskText,
    correctAnswer: parsed.answer,
    createdByUserId: params.userId,
  });

  const sessionId = await createTaskSession({
    userId: params.userId,
    subject: params.subject,
    topic: params.topic,
    taskText: parsed.taskText,
    correctAnswer: parsed.answer,
    taskId: bank.taskId,
  });
  if (!sessionId) return jsonError("Failed to save task", 500);

  return NextResponse.json({
    ok: true,
    taskId: sessionId,
    taskText: parsed.taskText,
    publicId: bank.publicId,
    fromBank: false,
    bankReused: bank.reused,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const body = (await req.json().catch(() => null)) as
    | { subject?: Subject; topic?: string }
    | null;
  const subject = body?.subject;
  const topic = body?.topic?.trim() ?? "";

  if (!isSchoolSubject(subject)) {
    return jsonError("Invalid subject", 400);
  }
  if (!topic) return jsonError("Введите тему.", 400);
  if (topic.length > 200) return jsonError("Тема слишком длинная (макс. 200 символов).", 400);

  const { topicKey, topicNorm } = resolveTopicKey(subject, topic);
  const bankCandidate = await findUnseenBankTask(user.id, subject, topicKey, topicNorm, user.grade);

  const usage = await getUsageSnapshot(toQuotaUser(user));
  const remaining = usage.exempt ? 1 : usage.remaining.taskGenerate;
  const mixRate = getTaskBankMixRate();

  const shouldMixFromBank =
    bankCandidate != null && (remaining === 0 || Math.random() < mixRate);

  if (shouldMixFromBank) {
    return serveFromBank({ userId: user.id, bank: bankCandidate });
  }

  const llmGuard = assertYandexLlmConfigured();
  if (llmGuard) return llmGuard;

  const quota = await checkAndConsume(toQuotaUser(user), "task_generate");
  if (!quota.ok) {
    if (bankCandidate) {
      return serveFromBank({ userId: user.id, bank: bankCandidate });
    }
    return quotaErrorResponse(quota);
  }

  return generateWithLlm({
    subject,
    grade: user.grade,
    topic,
    userId: user.id,
    topicKey,
    topicNorm,
    allowRetry: true,
  });
}
