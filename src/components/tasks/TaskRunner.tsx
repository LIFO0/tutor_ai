"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardContent, CardHeader } from "@heroui/react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { AnswerInput } from "./AnswerInput";

export function TaskRunner({
  taskId,
  taskText,
  checked,
  initialAnswer,
  initialFeedback,
  initialCorrect,
}: {
  taskId: number;
  taskText: string;
  checked: boolean;
  initialAnswer?: string | null;
  initialFeedback?: string | null;
  initialCorrect?: boolean | null;
}) {
  const [answer, setAnswer] = useState(initialAnswer ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { correct: boolean; aiFeedback: string }>(
    checked && initialFeedback
      ? { correct: Boolean(initialCorrect), aiFeedback: initialFeedback }
      : null,
  );

  const canCheck = useMemo(() => answer.trim().length > 0 && !loading, [answer, loading]);

  async function check() {
    if (!canCheck) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tasks/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, userAnswer: answer }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; correct: boolean; aiFeedback: string }
        | { ok: false; error: string }
        | null;
      if (!res.ok || !data || data.ok !== true) {
        throw new Error((data as { error?: string } | null)?.error || "Ошибка проверки");
      }
      setResult({ correct: Boolean(data.correct), aiFeedback: String(data.aiFeedback || "") });
    } catch (e) {
      setResult({
        correct: false,
        aiFeedback: `⚠️ ${e instanceof Error ? e.message : "Ошибка"}`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="font-semibold">Задание</CardHeader>
        <CardContent>
          <MessageBubble role="assistant" content={taskText} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="font-semibold">Ваш ответ</CardHeader>
        <CardContent className="flex flex-col gap-3">
          <AnswerInput value={answer} onChange={setAnswer} disabled={loading} />
          <Button variant="primary" isDisabled={!canCheck} onPress={check}>
            {loading ? "Проверяем…" : "Проверить"}
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader className="font-semibold">
            {result.correct ? "✅ Верно!" : "❌ Неверно"}
          </CardHeader>
          <CardContent>
            <MessageBubble role="assistant" content={result.aiFeedback} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

