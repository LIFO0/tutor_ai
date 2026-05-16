"use client";

import { Button } from "@heroui/react";
import { logoutAndRedirect } from "@/lib/logout-client";

export function LogoutButton() {
  return (
    <Button size="sm" variant="tertiary" onPress={() => void logoutAndRedirect()}>
      Выйти
    </Button>
  );
}
