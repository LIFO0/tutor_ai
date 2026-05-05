import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getChatSession, listMessages } from "@/lib/chat";
import { getCurrentUser } from "@/lib/current-user";
import { ChatWindow } from "@/components/chat/ChatWindow";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<Metadata> {
  const user = await getCurrentUser();
  if (!user) return { title: "Мишка знает" };

  const { sessionId } = await params;
  const id = Number(sessionId);
  if (!Number.isInteger(id)) return { title: "Мишка знает" };

  const session = await getChatSession(user.id, id);
  if (!session) return { title: "Мишка знает" };

  const topic = session.title?.trim();
  return { title: topic ? `Мишка знает - ${topic}` : "Мишка знает" };
}

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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto flex min-h-0 w-full max-w-3xl min-w-0 flex-1 flex-col">
        <ChatWindow
          sessionId={id}
          title={data.session.title}
          initialMessages={data.messages}
        />
      </div>
    </div>
  );
}
