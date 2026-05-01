"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
} from "@heroui/react";
import Image from "next/image";

import authImage from "../../../../9er6u.jpg";

const grades = Array.from({ length: 7 }, (_, i) => 5 + i);
const avatars = ["bear1", "bear2", "bear3", "bear4"];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState<number>(7);
  const [avatar, setAvatar] = useState<string>("bear1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return name.trim() && email.trim() && password.length >= 6;
  }, [name, email, password]);

  async function onSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, grade, avatar }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Ошибка регистрации");
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-zinc-950">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        <div className="flex items-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-xl">
            <Card className="shadow-none ring-0 bg-transparent">
              <CardHeader className="flex flex-col items-start gap-2 px-0">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  🐻 Мишка знает
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Sign up
                </h1>
                <p className="text-sm text-zinc-900 dark:text-zinc-50">
                  Расскажите немного о себе — класс нужен, чтобы объяснения были “по программе”.
                </p>
              </CardHeader>

              <CardContent className="flex flex-col gap-4 px-0 pt-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Имя</label>
                  <input
                    className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Email</label>
                  <input
                    className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Пароль</label>
                  <input
                    className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete="new-password"
                  />
                  <div className="text-xs text-zinc-900 dark:text-zinc-50">Минимум 6 символов</div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Класс</div>
                    <select
                      className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      value={grade}
                      onChange={(e) => setGrade(Number(e.target.value))}
                    >
                      {grades.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Аватар</div>
                    <select
                      className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                    >
                      {avatars.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {error ? <div className="text-sm text-red-600">{error}</div> : null}

                <Button
                  variant="primary"
                  className="font-semibold"
                  isDisabled={!canSubmit || loading}
                  onPress={onSubmit}
                >
                  {loading ? "Создаём…" : "Создать аккаунт"}
                </Button>

                <div className="text-sm text-zinc-900 dark:text-zinc-50">
                  Уже есть аккаунт?{" "}
                  <Link className="text-[color:var(--color-accent)]" href="/login">
                    Войти
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="relative hidden md:block">
          <Image
            src={authImage}
            alt="Forest"
            fill
            priority
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>
      </div>
    </div>
  );
}

