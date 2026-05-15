import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createChatSession, listChatSessions } from "@/lib/chat";
import { isValidChatSubject, type Subject } from "@/lib/subjects";
import { ChatSessionsSidebar } from "@/components/chat/ChatSessionsSidebar";

export const dynamic = "force-dynamic";

export default async function ChatListPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: Subject }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const subject = sp.subject;
  if (isValidChatSubject(subject)) {
    const id = await createChatSession({ userId: user.id, subject });
    if (id) redirect(`/chat/${id}`);
  }

  const sessions = await listChatSessions(user.id);
  return (
    <div className="flex min-h-0 flex-1 flex-col max-md:pt-0 md:py-4">
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
        <ChatSessionsSidebar sessions={sessions} />
      </div>
    </div>
  );
}
