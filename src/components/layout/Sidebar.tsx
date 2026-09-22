"use client";

import type { CurrentUser } from "@/lib/current-user";
import { SidebarPanel } from "./SidebarPanel";

export function Sidebar({
  user,
  collapsed,
  onToggleCollapse,
}: {
  user: CurrentUser;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <aside
      className={[
        "hidden md:sticky md:top-0 md:flex md:h-screen md:shrink-0 md:flex-col md:border-r md:border-zinc-200 md:bg-white md:dark:border-zinc-800 md:dark:bg-zinc-950",
        "transition-[width] duration-200 ease-out",
        collapsed ? "md:w-[4.5rem]" : "md:w-72",
      ].join(" ")}
    >
      <SidebarPanel
        user={user}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />
    </aside>
  );
}
