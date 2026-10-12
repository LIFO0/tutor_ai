"use client";

import { useUsage } from "@/hooks/useUsage";
import { isQuotaLow, type QuotaCounters } from "@/lib/usage-types";

const ROWS: { key: keyof QuotaCounters; label: string }[] = [
  { key: "chatMessages", label: "Вопросы Мишке" },
  { key: "chatImages", label: "Фото в чате" },
  { key: "chatSessions", label: "Новые чаты" },
  { key: "taskGenerate", label: "Новые задачи" },
  { key: "taskCheck", label: "Проверки ответов" },
  { key: "taskOpen", label: "Задачи по коду" },
];

export function UsageTodayBlock() {
  const { usage, loading } = useUsage();

  return (
    <section className="flex flex-col gap-2" aria-labelledby="usage-today-title">
      <h2 id="usage-today-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Сегодня осталось
      </h2>
      {loading && !usage ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Считаем…</p>
      ) : !usage ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Не получилось загрузить лимиты. Попробуй обновить страницу.</p>
      ) : usage.exempt ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">У тебя нет дневных ограничений — занимайся сколько хочешь!</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {ROWS.map(({ key, label }) => {
              const limit = usage.limits[key];
              const remaining = Math.max(0, Math.min(limit, usage.remaining[key]));
              const pct = limit > 0 ? Math.round((remaining / limit) * 100) : 0;
              const low = isQuotaLow(remaining, limit);
              const empty = remaining === 0;
              const bar = empty ? "bg-red-500" : low ? "bg-amber-500" : "bg-emerald-500";
              return (
                <li key={key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-200">{label}</span>
                    <span
                      className={
                        empty
                          ? "text-red-600 dark:text-red-400"
                          : low
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-zinc-500 dark:text-zinc-400"
                      }
                    >
                      {remaining} из {limit}
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                    role="progressbar"
                    aria-label={label}
                    aria-valuemin={0}
                    aria-valuemax={limit}
                    aria-valuenow={remaining}
                  >
                    <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Лимиты обновляются каждый день в 00:00 по Москве.
          </p>
        </>
      )}
    </section>
  );
}
