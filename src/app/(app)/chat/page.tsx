import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@heroui/react";
import { getCurrentUser } from "@/lib/current-user";
import { createChatSession, listChatSessions } from "@/lib/chat";
import type { Subject } from "@/lib/subjects";
import { SUBJECTS } from "@/lib/subjects";

export const dynamic = "force-dynamic";

export default async function ChatListPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: Subject }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const subject = sp.subject;
  if (subject === "math" || subject === "physics" || subject === "russian") {
    const id = await createChatSession({ userId: user.id, subject });
    if (id) redirect(`/chat/${id}`);
  }

  const sessions = await listChatSessions(user.id);
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="font-semibold">Начать новый чат</CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          {SUBJECTS.map((s) => (
            <Link
              key={s.key}
              href={`/chat?subject=${s.key}`}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {s.title}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="font-semibold">Мои сессии</CardHeader>
        <CardContent className="flex flex-col gap-2">
          {sessions.length === 0 ? (
              <div className="text-sm text-zinc-900 dark:text-zinc-50">
                Пока нет чатов. Выберите предмет выше, чтобы начать.
              </div>
          ) : (
            sessions.map((s) => (
              <Link
                key={s.id}
                href={`/chat/${s.id}`}
                className="inline-flex h-10 items-center justify-start rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                {s.title || "Новый чат"} · {String(s.subject)}
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

