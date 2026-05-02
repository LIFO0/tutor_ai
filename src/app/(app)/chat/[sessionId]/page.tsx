import { notFound } from "next/navigation";
import { listMessages } from "@/lib/chat";
import { getCurrentUser } from "@/lib/current-user";
import { ChatWindow } from "@/components/chat/ChatWindow";

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

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-3rem)] px-4 py-3">
      <div className="mx-auto h-[calc(100vh-3rem)] min-h-0 w-full max-w-4xl">
        <ChatWindow
          sessionId={id}
          title={data.session.title}
          initialMessages={data.messages}
        />
      </div>
    </div>
  );
}
