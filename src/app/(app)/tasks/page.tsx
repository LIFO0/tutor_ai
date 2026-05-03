import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getTaskStats } from "@/lib/tasks";
import { TasksClient } from "./TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stats = await getTaskStats(user.id);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
      <TasksClient solvedToday={stats.solvedToday} solvedTotal={stats.solvedTotal} />
    </div>
  );
}
