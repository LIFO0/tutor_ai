import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@heroui/react";
import { authCookieName } from "@/lib/auth";

export default async function Home() {
  const c = await cookies();
  const token = c.get(authCookieName)?.value;
  if (token) redirect("/dashboard");

  return (
    <div className="min-h-full flex flex-1 items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader className="flex flex-col gap-2 items-start">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">🐻 Мишка знает</div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Виртуальный репетитор для 5–11 классов
          </h1>
          <p className="text-sm text-zinc-900 dark:text-zinc-50">
            Чат с объяснениями, формулы в LaTeX и режим заданий с проверкой.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[color:var(--color-accent)] px-4 text-sm font-semibold text-white hover:opacity-95"
          >
            Начать — регистрация
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Уже есть аккаунт — войти
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
