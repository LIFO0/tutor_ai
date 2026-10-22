"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignInPage } from "@/components/ui/sign-in";
import { YandexSignInButton } from "@/components/ui/YandexSignInButton";
import { readSafeNextParam, useSafeNextParam } from "@/hooks/useSafeNextParam";
import { loginPathWithNext } from "@/lib/safe-next";

export default function LoginPage() {
  const router = useRouter();
  const next = useSafeNextParam();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextEmail = String(formData.get("email") || "");
    const nextPassword = String(formData.get("password") || "");
    setEmail(nextEmail);

    if (!nextEmail.trim() || !nextPassword) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail, password: nextPassword }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Ошибка входа");
      router.replace(readSafeNextParam() ?? "/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SignInPage
        title="Вход"
        description="Введите email и пароль, чтобы продолжить."
        onSignIn={onSubmit}
        onCreateAccount={() => router.push(loginPathWithNext(next, "/register"))}
        extraActions={
          <YandexSignInButton
            href={
              next
                ? `/api/auth/yandex/start?next=${encodeURIComponent(next)}`
                : "/api/auth/yandex/start"
            }
          />
        }
        error={error}
        loading={loading}
        defaultEmail={email}
        rightImage="/bears/bear_welcoming_update.webp"
        rightImageAlt="Мишка приветствует тебя"
      />

      <div className="sr-only">
        <Link href={loginPathWithNext(next, "/register")}>Зарегистрироваться</Link>
      </div>
    </>
  );
}

