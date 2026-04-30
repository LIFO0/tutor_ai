"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="tertiary"
      onPress={async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        router.replace("/login");
      }}
    >
      Выйти
    </Button>
  );
}

