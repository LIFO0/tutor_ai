"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardContent, CardHeader } from "@heroui/react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { BearTotem, type BearTotemVariant } from "@/components/ui/BearTotem";
import { normalizeStoredTaskFeedback } from "@/lib/task-check-json";
import { AnswerInput } from "./AnswerInput";
import { useUsage, parseQuotaResponse } from "@/hooks/useUsage";
import { QuotaExceededBanner } from "@/components/usage/QuotaExceededBanner";
import { quotaExceededMessage, quotaWarningMessage } from "@/lib/usage-types";

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
      ? {
          correct: Boolean(initialCorrect),
          aiFeedback: normalizeStoredTaskFeedback(initialFeedback),
        }
      : null,
  );

  const { usage, refresh: refreshUsage } = useUsage();

  const checkBlocked = !usage?.exempt && (usage?.remaining.taskCheck ?? 1) === 0;
  const checkWarning =
    !usage?.exempt &&
    !checkBlocked &&
    usage != null &&
    usage.remaining.taskCheck > 0 &&
    usage.remaining.taskCheck <= 3;

  const canCheck = useMemo(
    () => answer.trim().length > 0 && !loading && !checkBlocked,
    [answer, loading, checkBlocked],
  );

  const bearVariant: BearTotemVariant = useMemo(() => {
    if (result == null) return "thinking";
    return result.correct ? "happy" : "standard";
  }, [result]);

  const bearSlot = useMemo(
    () => <BearTotem variant={bearVariant} size="sm" />,
    [bearVariant],
  );

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
        | { ok: false; error: string; message?: string }
        | null;
      const quota = parseQuotaResponse(res, data);
      if (quota) {
        setResult({
          correct: false,
          aiFeedback: `⚠️ ${quota.message ?? quotaExceededMessage("task_check", quota.limit)}`,
        });
        void refreshUsage();
        return;
      }
      if (!res.ok || !data || data.ok !== true) {
        const msg =
          (data && "message" in data && typeof data.message === "string" ? data.message : null) ||
          (data as { error?: string } | null)?.error ||
          "Ошибка проверки";
        throw new Error(msg);
      }
      void refreshUsage();
      setResult({ correct: Boolean(data.correct), aiFeedback: normalizeStoredTaskFeedback(String(data.aiFeedback || "")) });
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
    <div className="flex min-w-0 flex-col gap-4">
      <Card>
        <CardHeader className="font-semibold">Задание</CardHeader>
        <CardContent>
          <MessageBubble
            role="assistant"
            content={taskText}
            assistantFullWidth
            assistantEnd={bearSlot}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="font-semibold">Ваш ответ</CardHeader>
        <CardContent className="flex flex-col gap-3">
          {checkBlocked && usage ? (
            <QuotaExceededBanner
              message={quotaExceededMessage("task_check", usage.limits.taskCheck)}
              resetsAt={usage.resetsAt}
            />
          ) : (
            <>
              {checkWarning && usage ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {quotaWarningMessage("task_check", usage.remaining.taskCheck)}
                </p>
              ) : null}
              <AnswerInput value={answer} onChange={setAnswer} disabled={loading || checkBlocked} />
              <Button variant="primary" isDisabled={!canCheck} onPress={check}>
                {loading ? "Проверяем…" : "Проверить"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader className="font-semibold">
            {result.correct ? "✅ Верно!" : "❌ Неверно"}
          </CardHeader>
          <CardContent>
            <MessageBubble role="assistant" content={normalizeStoredTaskFeedback(result.aiFeedback)} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

