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
    <div className="-mx-4 -my-6 flex min-h-[calc(100vh-3rem)] justify-center px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <ChatSessionsSidebar sessions={sessions} />
      </div>
    </div>
  );
}
