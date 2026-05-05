"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, ListBox, Select } from "@heroui/react";
import type { Subject } from "@/lib/subjects";
import { SUBJECTS } from "@/lib/subjects";

export function TasksClient({
  solvedToday,
  solvedTotal,
  history,
}: {
  solvedToday: number;
  solvedTotal: number;
  history: Array<{ id: number; subject: string; topic: string; correct: boolean | null; createdAt: string }>;
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
            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                htmlFor="tasks-subject"
              >
                Предмет
              </label>
              <Select
                fullWidth
                variant="secondary"
                value={subject}
                onChange={(key) => {
                  if (key == null) return;
                  setSubject(key as Subject);
                }}
                aria-label="Предмет"
                className="w-full"
              >
                <Select.Trigger
                  id="tasks-subject"
                  className={[
                    "h-11 w-full justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-start text-sm font-normal text-zinc-900 shadow-none",
                    "outline-none focus-visible:border-zinc-400 data-[focus-visible]:border-zinc-400 data-[focus-visible]:ring-0",
                    "dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
                  ].join(" ")}
                >
                  <Select.Value />
                  <Select.Indicator className="shrink-0 text-zinc-500 dark:text-zinc-400" />
                </Select.Trigger>
                <Select.Popover
                  placement="bottom start"
                  className="overflow-x-hidden"
                >
                  <ListBox className="max-h-60 min-w-0 overflow-x-hidden overflow-y-auto py-1.5 px-2.5 outline-none">
                    {SUBJECTS.map((s) => (
                      <ListBox.Item
                        key={s.key}
                        id={s.key}
                        textValue={s.title}
                        className="mx-0.5 cursor-pointer rounded-lg px-3 py-2 text-sm text-zinc-900 outline-none data-[focused]:bg-zinc-100 data-[selected]:bg-zinc-100 data-[selected]:font-medium dark:text-zinc-50 dark:data-[focused]:bg-zinc-800 dark:data-[selected]:bg-zinc-800"
                      >
                        {s.title}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Тема</label>
              <input
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
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
          {history.length === 0 ? (
            <div>
              История появится после первого задания. Пока можно перейти в{" "}
              <Link href="/chat" className="underline">
                чат
              </Link>
              .
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((h) => {
                const subj = SUBJECTS.find((s) => s.key === (h.subject as Subject))?.title ?? h.subject;
                const status =
                  h.correct === null
                    ? { label: "Не проверено", cls: "text-zinc-500 dark:text-zinc-400" }
                    : h.correct
                      ? { label: "Верно", cls: "text-emerald-700 dark:text-emerald-400" }
                      : { label: "Неверно", cls: "text-amber-700 dark:text-amber-400" };
                return (
                  <li key={h.id}>
                    <Link
                      href={`/tasks/${h.id}`}
                      className="block rounded-2xl border border-zinc-200 bg-white px-3 py-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{h.topic}</div>
                          <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {subj}
                            <span className="text-zinc-300 dark:text-zinc-700"> · </span>
                            #{h.id}
                          </div>
                        </div>
                        <div className={`shrink-0 text-xs font-semibold ${status.cls}`}>{status.label}</div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
