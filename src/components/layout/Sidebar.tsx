"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button, Card } from "@heroui/react";
import type { CurrentUser } from "@/lib/current-user";
import { Bear } from "@/components/ui/Bear";
import { LogoutButton } from "./LogoutButton";

export function Sidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = [
    { href: "/dashboard", label: "Главная" },
    { href: "/chat", label: "Чат" },
    { href: "/tasks", label: "Задания" },
    { href: "/profile", label: "Профиль" },
  ];

  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-72 md:flex-col md:border-r md:border-zinc-200 md:bg-white md:dark:border-zinc-800 md:dark:bg-zinc-950">
      <div className="flex items-center gap-3 px-4 py-4">
        <Bear />
        <div className="flex flex-col">
          <div className="text-sm font-semibold">Мишка знает</div>
          <div className="text-xs text-zinc-500">ИИ-репетитор</div>
        </div>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Button
              key={item.href}
              variant={active ? "secondary" : "ghost"}
              className="justify-start"
              onPress={() => router.push(item.href)}
            >
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-3">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <Bear />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user.name}</div>
              <div className="truncate text-xs text-zinc-500">{user.grade} класс</div>
            </div>
            <LogoutButton />
          </div>
        </Card>
      </div>
    </aside>
  );
}

