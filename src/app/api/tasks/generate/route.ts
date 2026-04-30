import { NextResponse } from "next/server";
import type { Subject } from "@/lib/subjects";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { taskGeneratePrompt } from "@/lib/prompts";
import { completeOnce } from "@/lib/llm";
import { createTaskSession } from "@/lib/tasks";

function parseTask(text: string) {
  const mTask = text.match(/ЗАДАЧА:\s*([\s\S]*?)\n\s*ОТВЕТ:/i);
  const mAns = text.match(/ОТВЕТ:\s*([\s\S]*)$/i);
  const taskText = (mTask?.[1] ?? text).trim();
  const answer = (mAns?.[1] ?? "").trim();
  return { taskText, answer: answer || "—" };
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const body = (await req.json().catch(() => null)) as
    | { subject?: Subject; topic?: string }
    | null;
  const subject = body?.subject;
  const topic = body?.topic?.trim() ?? "";

  if (subject !== "math" && subject !== "physics" && subject !== "russian") {
    return jsonError("Invalid subject", 400);
  }
  if (!topic) return jsonError("Введите тему.", 400);

  const prompt = taskGeneratePrompt({ subject, grade: user.grade, topic });
  const raw = await completeOnce({
    messages: [
      { role: "system", text: "Ты — генератор школьных задач. Отвечай строго по формату." },
      { role: "user", text: prompt },
    ],
    temperature: 0.4,
    maxTokens: 900,
  });

  const parsed = parseTask(raw);
  const id = await createTaskSession({
    userId: user.id,
    subject,
    topic,
    taskText: parsed.taskText,
    correctAnswer: parsed.answer,
  });
  if (!id) return jsonError("Failed to save task", 500);

  return NextResponse.json({ ok: true, taskId: id, taskText: parsed.taskText });
}

