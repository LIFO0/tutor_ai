import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { redirectToLoginForInvalidSession } from "@/lib/session-redirect";
import { createChatSession, listChatSessions } from "@/lib/chat";
import { isValidChatSubject, type Subject } from "@/lib/subjects";
import { ChatSessionsSidebar } from "@/components/chat/ChatSessionsSidebar";
import { checkAndConsume, toQuotaUser } from "@/lib/usage-quota";

export const dynamic = "force-dynamic";

export default async function ChatListPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: Subject }>;
}) {
  const user = await getCurrentUser();
  if (!user) return redirectToLoginForInvalidSession();

  const sp = await searchParams;
  const subject = sp.subject;
  let quotaMessage: string | null = null;
  if (isValidChatSubject(subject)) {
    // Тот же лимит «Новые чаты», что и у POST /api/chat/sessions (раньше этот путь его не учитывал).
    const quota = await checkAndConsume(toQuotaUser(user), "chat_session");
    if (quota.ok) {
      const id = await createChatSession({ userId: user.id, subject });
      if (id) redirect(`/chat/${id}`);
    } else {
      quotaMessage = quota.message;
    }
  }

  const sessions = await listChatSessions(user.id);
  return (
    <div className="flex min-h-0 flex-1 flex-col max-md:pt-0 md:py-4">
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
        {quotaMessage ? (
          <div className="mx-1 mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {quotaMessage}
          </div>
        ) : null}
        <ChatSessionsSidebar sessions={sessions} />
      </div>
    </div>
  );
}
