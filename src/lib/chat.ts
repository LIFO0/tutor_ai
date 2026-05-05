import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import type { Subject } from "@/lib/subjects";
import { getDb, schema } from "@/lib/db";

export async function listChatSessions(userId: number) {
  const db = getDb();
  // Avoid JOIN + GROUP BY over potentially large `messages` table.
  // Use an indexed correlated subquery instead.
  return await db
    .select({
      id: schema.chatSessions.id,
      subject: schema.chatSessions.subject,
      title: schema.chatSessions.title,
      createdAt: schema.chatSessions.createdAt,
      lastMessageAt: sql<string | null>`(
        select max(m.created_at)
        from messages as m
        where m.session_id = ${schema.chatSessions.id}
      )`,
    })
    .from(schema.chatSessions)
    .where(eq(schema.chatSessions.userId, userId))
    .orderBy(desc(schema.chatSessions.id))
    .limit(50);
}

export async function createChatSession(params: {
  userId: number;
  subject: Subject;
  title?: string;
}) {
  const db = getDb();
  const rows = await db
    .insert(schema.chatSessions)
    .values({ userId: params.userId, subject: params.subject, title: params.title })
    .returning({ id: schema.chatSessions.id });
  return rows[0]?.id as number | undefined;
}

export async function getChatSession(userId: number, sessionId: number) {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.chatSessions.id,
      subject: schema.chatSessions.subject,
      title: schema.chatSessions.title,
      createdAt: schema.chatSessions.createdAt,
    })
    .from(schema.chatSessions)
    .where(and(eq(schema.chatSessions.userId, userId), eq(schema.chatSessions.id, sessionId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listMessages(userId: number, sessionId: number) {
  const db = getDb();
  // Ensure session belongs to user
  const session = await getChatSession(userId, sessionId);
  if (!session) return null;

  const rows = await db
    .select({
      id: schema.messages.id,
      role: schema.messages.role,
      content: schema.messages.content,
      createdAt: schema.messages.createdAt,
    })
    .from(schema.messages)
    .where(eq(schema.messages.sessionId, sessionId))
    .orderBy(asc(schema.messages.id));

  return { session, messages: rows };
}

export async function listRecentMessagesForSession(params: {
  userId: number;
  sessionId: number;
  limit: number;
}) {
  const db = getDb();
  const session = await getChatSession(params.userId, params.sessionId);
  if (!session) return null;

  // Get last N by id desc, then reverse to chronological order.
  const recentDesc = await db
    .select({
      id: schema.messages.id,
      role: schema.messages.role,
      content: schema.messages.content,
    })
    .from(schema.messages)
    .where(eq(schema.messages.sessionId, params.sessionId))
    .orderBy(desc(schema.messages.id))
    .limit(params.limit);

  const recent = [...recentDesc].reverse();
  return { session, messages: recent };
}

export async function addMessage(params: {
  sessionId: number;
  role: "user" | "assistant";
  content: string;
}) {
  const db = getDb();
  const rows = await db
    .insert(schema.messages)
    .values({ sessionId: params.sessionId, role: params.role, content: params.content })
    .returning({ id: schema.messages.id });
  return rows[0]?.id as number | undefined;
}

export async function updateChatTitleIfEmpty(sessionId: number, title: string) {
  const db = getDb();
  await db
    .update(schema.chatSessions)
    .set({ title })
    .where(and(eq(schema.chatSessions.id, sessionId), isNull(schema.chatSessions.title)));
}

/** Удаляет все сообщения сессии и саму сессию. Возвращает false, если сессия не найдена или не принадлежит пользователю. */
export async function deleteChatSession(userId: number, sessionId: number): Promise<boolean> {
  const session = await getChatSession(userId, sessionId);
  if (!session) return false;

  const db = getDb();
  await db.delete(schema.messages).where(eq(schema.messages.sessionId, sessionId));
  await db
    .delete(schema.chatSessions)
    .where(and(eq(schema.chatSessions.id, sessionId), eq(schema.chatSessions.userId, userId)));
  return true;
}

