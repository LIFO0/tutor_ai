import { getCurrentUser } from "@/lib/current-user";
import { redirectToLoginForInvalidSession } from "@/lib/session-redirect";
import { getTaskStats, listTaskHistory } from "@/lib/tasks";
import { TasksClient } from "./TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) return redirectToLoginForInvalidSession();

  const stats = await getTaskStats(user.id);
  const history = await listTaskHistory(user.id);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pb-0">
      <TasksClient
        solvedToday={stats.solvedToday}
        solvedTotal={stats.solvedTotal}
        history={history}
      />
    </div>
  );
}
