import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getTask } from "@/lib/tasks";
import { TaskRunner } from "@/components/tasks/TaskRunner";

export const dynamic = "force-dynamic";

export default async function TaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return notFound();

  const { taskId } = await params;
  const id = Number(taskId);
  if (!Number.isInteger(id)) return notFound();

  const task = await getTask(user.id, id);
  if (!task) return notFound();

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
      <TaskRunner
        taskId={id}
        taskText={task.taskText}
        checked={task.correct !== null && task.correct !== undefined}
        initialAnswer={task.userAnswer}
        initialFeedback={task.aiFeedback}
      />
    </div>
  );
}

