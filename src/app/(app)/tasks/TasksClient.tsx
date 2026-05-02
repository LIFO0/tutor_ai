"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, Button } from "@heroui/react";
import type { Subject } from "@/lib/subjects";
import { SUBJECTS } from "@/lib/subjects";

export function TasksClient({
  solvedToday,
  solvedTotal,
}: {
  solvedToday: number;
  solvedTotal: number;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState<Subject>("math");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const can = useMemo(() => topic.trim().length > 0 && !loading, [topic, loading]);

  async function generate() {
    if (!can) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; taskId: number }
        | { ok: false; error: string }
        | null;
      if (!res.ok || !data || data.ok !== true) {
        throw new Error((data as { error?: string } | null)?.error || "Ошибка генерации");
      }
      router.push(`/tasks/${data.taskId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="font-semibold">Статистика</CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-xs text-zinc-900 dark:text-zinc-50">Решено сегодня</div>
              <div className="text-2xl font-semibold">{solvedToday}</div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-xs text-zinc-900 dark:text-zinc-50">Решено всего</div>
              <div className="text-2xl font-semibold">{solvedTotal}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="font-semibold">Режим заданий</CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Предмет</label>
              <select
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
              >
                {SUBJECTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Тема</label>
              <input
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Например: дроби, закон Ома, причастия…"
              />
            </div>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <Button variant="primary" isDisabled={!can} onPress={generate}>
            {loading ? "Генерируем…" : "Получить задание"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="font-semibold">История</CardHeader>
        <CardContent className="text-sm text-zinc-900 dark:text-zinc-50">
          История появится после первого задания. Пока можно перейти в{" "}
          <Link href="/chat" className="underline">
            чат
          </Link>
          .
        </CardContent>
      </Card>
    </div>
  );
}
