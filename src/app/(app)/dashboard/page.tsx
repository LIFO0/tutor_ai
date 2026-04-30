import Link from "next/link";
import { Card, CardContent, CardHeader } from "@heroui/react";
import { getCurrentUser } from "@/lib/current-user";
import { SUBJECTS } from "@/lib/subjects";
import { listChatSessions } from "@/lib/chat";
import { getTaskStats } from "@/lib/tasks";
import { Bear } from "@/components/ui/Bear";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const stats = user ? await getTaskStats(user.id) : { solvedToday: 0, solvedTotal: 0 };
  const recentChats = user ? (await listChatSessions(user.id)).slice(0, 3) : [];
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex items-center gap-3">
          <Bear />
          <div className="flex flex-col">
            <div className="text-lg font-semibold">
              {user ? `Привет, ${user.name}!` : "Привет!"}
            </div>
            <div className="text-sm text-zinc-500">
              Выберите предмет — и задавайте вопросы как в чате.
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SUBJECTS.map((s) => (
            <Card key={s.key} className="border border-zinc-200/60 dark:border-zinc-800/60">
              <CardHeader className="flex flex-col items-start gap-1">
                <div className="font-semibold">{s.title}</div>
                <div className="text-xs text-zinc-500">{s.description}</div>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/chat?subject=${s.key}`}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  Начать чат
                </Link>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="font-semibold">Быстрые действия</CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              href="/chat"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              Открыть список чатов
            </Link>
            <Link
              href="/tasks"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              Перейти в режим заданий
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="font-semibold">Статистика</CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-xs text-zinc-500">Решено сегодня</div>
                <div className="text-2xl font-semibold">{stats.solvedToday}</div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-xs text-zinc-500">Решено всего</div>
                <div className="text-2xl font-semibold">{stats.solvedTotal}</div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-medium text-zinc-500">Последние чаты</div>
              {recentChats.length === 0 ? (
                <div className="text-sm text-zinc-500">Пока пусто — начните чат по предмету выше.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentChats.map((c) => (
                    <Link
                      key={c.id}
                      href={`/chat/${c.id}`}
                      className="truncate rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                    >
                      {c.title || "Новый чат"} · {String(c.subject)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

