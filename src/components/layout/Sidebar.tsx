"use client";

import type { CurrentUser } from "@/lib/current-user";
import { SidebarPanel } from "./SidebarPanel";

export function Sidebar({ user }: { user: CurrentUser }) {
  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-72 md:shrink-0 md:flex-col md:border-r md:border-zinc-200 md:bg-white md:dark:border-zinc-800 md:dark:bg-zinc-950">
      <SidebarPanel user={user} />
    </aside>
  );
}
