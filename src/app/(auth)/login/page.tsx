"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignInPage } from "@/components/ui/sign-in";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim() && password.length > 0, [email, password]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextEmail = String(formData.get("email") || "");
    const nextPassword = String(formData.get("password") || "");
    setEmail(nextEmail);
    setPassword(nextPassword);

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
    <>
      <SignInPage
        title="Вход"
        description="Введите email и пароль, чтобы продолжить."
        onSignIn={onSubmit}
        onTestSignIn={loginTest}
        onCreateAccount={() => router.push("/register")}
        error={error}
        loading={loading}
        defaultEmail={email}
        rightImage="/bears/bear_welcoming_update.png"
        rightImageAlt="Bear illustration"
      />

      <div className="sr-only">
        <Link href="/register">Зарегистрироваться</Link>
      </div>
    </>
  );
}

