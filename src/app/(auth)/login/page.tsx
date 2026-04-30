"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader } from "@heroui/react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim() && password.length > 0, [email, password]);

  async function onSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Ошибка входа");
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  async function loginTest() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/test", { method: "POST" });
      const data = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error: string }
        | null;
      if (!res.ok || !data || data.ok !== true) {
        throw new Error((data as { error?: string } | null)?.error || "Не удалось войти тестовым");
      }
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="flex flex-col items-start gap-2">
        <div className="text-sm font-medium text-zinc-500">🐻 Мишка знает</div>
        <h1 className="text-2xl font-semibold tracking-tight">Вход</h1>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Email</label>
          <input
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Пароль</label>
          <input
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
          />
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <Button variant="primary" className="font-semibold" isDisabled={!canSubmit || loading} onPress={onSubmit}>
          {loading ? "Входим…" : "Войти"}
        </Button>

        <Button
          variant="secondary"
          isDisabled={loading}
          onPress={loginTest}
        >
          Войти как тестовый ученик
        </Button>

        <div className="text-sm text-zinc-500">
          Нет аккаунта?{" "}
          <Link className="text-[color:var(--color-accent)]" href="/register">
            Зарегистрироваться
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

