import { notFound } from "next/navigation";
import { listChatSessions, listMessages } from "@/lib/chat";
import { getCurrentUser } from "@/lib/current-user";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatSessionsSidebar } from "@/components/chat/ChatSessionsSidebar";

export const dynamic = "force-dynamic";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return notFound();

  const { sessionId } = await params;
  const id = Number(sessionId);
  if (!Number.isInteger(id)) return notFound();

  const data = await listMessages(user.id, id);
  if (!data) return notFound();

  const sessions = await listChatSessions(user.id);
  return (
    <div className="-mx-4 -my-6 flex min-h-[calc(100vh-3rem)] flex-col md:flex-row">
      <ChatSessionsSidebar sessions={sessions} activeSessionId={id} />
      <div className="h-[calc(100vh-3rem)] min-h-0 flex-1 px-4 py-3">
        <ChatWindow
          sessionId={id}
          title={data.session.title}
          initialMessages={data.messages}
        />
      </div>
    </div>
  );
}

