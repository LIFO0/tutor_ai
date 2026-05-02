import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getTaskStats } from "@/lib/tasks";
import { TasksClient } from "./TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stats = await getTaskStats(user.id);

  return <TasksClient solvedToday={stats.solvedToday} solvedTotal={stats.solvedTotal} />;
}
