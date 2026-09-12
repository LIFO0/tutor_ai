import { and, asc, desc, eq, gte, isNull, max, sql } from "drizzle-orm";
import { isValidChatSubject, normalizeChatSubject, type Subject } from "@/lib/subjects";
import { getDb, schema } from "@/lib/db";
import { utcNowIso } from "@/lib/sqlite-datetime";
import { completeText } from "@/lib/llm";

const AUTO_TITLE_INITIAL_WINDOW_MESSAGES = 8;
const AUTO_TITLE_CONTEXT_MESSAGES = 18;

function normalizeTitleCandidate(input: string) {
  const t = input
    .replaceAll(/\s+/g, " ")
    .trim()
    .replaceAll(/^["'«»]+|["'«»]+$/g, "")
    .replaceAll(/[.]+$/g, "")
    .trim();
  if (!t) return null;
  return t.length > 60 ? t.slice(0, 60).trim() : t;
}

function isBadAutoTitle(title: string | null | undefined) {
  const t = (title ?? "").trim().toLowerCase();
  if (!t) return true;
  if (t.length <= 2) return true;
  if (/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+$/u.test(t)) return true;
  if (/^(привет|здравствуйте|здарова|хай|hi|hello|yo|ок|окей|ладно|спасибо|пожалуйста)\b/u.test(t))
    return true;
  if (/^(да|нет|угу|ага)\b/u.test(t) && t.length <= 6) return true;
  return false;
}

function heuristicTitleFromMessages(messages: { role: string; content: string }[]) {
  for (const m of messages) {
    if (m.role !== "user") continue;
    const c = m.content.trim();
    if (c.length < 4) continue;
    if (/^(привет|здравствуйте|хай|hi|hello|ок|окей|ладно|спасибо)\b/i.test(c)) continue;
    return normalizeTitleCandidate(c.slice(0, 60));
  }
  return null;
}

function normalizeSubjectCandidate(input: string) {
  const t = input.trim().toLowerCase();
  if (!t) return null;
  if (t === "математика") return "math" as const;
  if (t === "физика") return "physics" as const;
  if (t === "русский" || t === "русский язык" || t === "русскийязык") return "russian" as const;
  if (t === "свободная тема" || t === "свободнаятема") return "free" as const;
  if (isValidChatSubject(t)) return t;
  return null;
}

function heuristicSubjectFromMessages(messages: { role: string; content: string }[]) {
  const text = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n")
    .toLowerCase();

  if (
    /\b(уравнен|неравен|дроб|процент|функци|график|логарифм|корен|степен|sin|cos|tan|геометр|треуголь|площад|периметр|интеграл|производн)\b/u.test(
      text,
    )
  )
    return "math" as const;

  if (
    /\b(скорост|ускорен|сила|ньютон|энерги|работа|мощност|давлен|импульс|масса|трени|пружин|электр|ток|напряжен|сопротивлен|ом|вольт|ампер|магнит|оптик|линз|волна)\b/u.test(
      text,
    )
  )
    return "physics" as const;

  if (
    /\b(орфограф|пунктуац|ударен|суффикс|приставк|окончан|падеж|склонен|спряжен|грамматик|част[ьи] речи|причасти|деепричасти|запят|тире|правописан)\b/u.test(
      text,
    )
  )
    return "russian" as const;

  return "free" as const;
}

export async function listChatSessions(userId: number) {
  const db = getDb();

  const lastMsgSubq = db
    .select({
      sessionId: schema.messages.sessionId,
      lastMessageAt: max(schema.messages.createdAt).as("last_message_at"),
    })
    .from(schema.messages)
    .groupBy(schema.messages.sessionId)
    .as("last_msg");

  return await db
    .select({
      id: schema.chatSessions.id,
      subject: schema.chatSessions.subject,
      title: schema.chatSessions.title,
      createdAt: schema.chatSessions.createdAt,
      lastMessageAt: lastMsgSubq.lastMessageAt,
    })
    .from(schema.chatSessions)
    .leftJoin(lastMsgSubq, eq(schema.chatSessions.id, lastMsgSubq.sessionId))
    .where(eq(schema.chatSessions.userId, userId))
    .orderBy(desc(sql`coalesce(${lastMsgSubq.lastMessageAt}, ${schema.chatSessions.createdAt})`))
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
    .values({
      userId: params.userId,
      subject: params.subject,
      title: params.title,
      createdAt: utcNowIso(),
    })
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
    .values({
      sessionId: params.sessionId,
      role: params.role,
      content: params.content,
      createdAt: utcNowIso(),
    })
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

export async function updateChatTitle(sessionId: number, title: string) {
  const db = getDb();
  await db.update(schema.chatSessions).set({ title }).where(eq(schema.chatSessions.id, sessionId));
}

export async function countMessagesForSession(sessionId: number) {
  const db = getDb();
  const rows = await db
    .select({ c: sql<number>`count(*)` })
    .from(schema.messages)
    .where(eq(schema.messages.sessionId, sessionId));
  return Number(rows[0]?.c ?? 0);
}

export async function maybeUpdateChatTitleInitialWindow(params: {
  userId: number;
  sessionId: number;
}): Promise<string | null> {
  const db = getDb();
  const session = await getChatSession(params.userId, params.sessionId);
  if (!session) return null;

  const messagesCount = await countMessagesForSession(params.sessionId);
  if (messagesCount > AUTO_TITLE_INITIAL_WINDOW_MESSAGES) return null;
  if (!isBadAutoTitle(session.title)) return null;

  const ctx = await listRecentMessagesForSession({
    userId: params.userId,
    sessionId: params.sessionId,
    limit: AUTO_TITLE_CONTEXT_MESSAGES,
  });
  const history = ctx?.messages ?? [];

  // Prefer AI title if model is configured; otherwise fallback to heuristics.
  let nextTitle: string | null = null;
  const aiText = await completeText({
    messages: [
      {
        role: "system",
        text:
          "Сгенерируй короткую тему чата по текущему диалогу.\n" +
          "Правила: 2–6 слов, по-русски, без кавычек, без точки в конце, без эмодзи.\n" +
          "Максимум 60 символов. Верни ТОЛЬКО тему одной строкой.",
      },
      ...history.map((m) => ({
        role: m.role,
        text: m.content,
      })),
    ],
    maxTokens: 40,
    temperature: 0.2,
  });
  if (typeof aiText === "string") nextTitle = normalizeTitleCandidate(aiText);

  if (!nextTitle) {
    nextTitle = heuristicTitleFromMessages(history);
  }

  if (!nextTitle || isBadAutoTitle(nextTitle)) return null;
  if (session.title?.trim() === nextTitle) return null;

  await db
    .update(schema.chatSessions)
    .set({ title: nextTitle })
    .where(and(eq(schema.chatSessions.id, params.sessionId), eq(schema.chatSessions.userId, params.userId)));

  return nextTitle;
}

export async function updateChatSubject(sessionId: number, subject: Subject) {
  const db = getDb();
  await db.update(schema.chatSessions).set({ subject }).where(eq(schema.chatSessions.id, sessionId));
}

export async function maybeUpdateChatSubjectInitialWindow(params: {
  userId: number;
  sessionId: number;
}) {
  const session = await getChatSession(params.userId, params.sessionId);
  if (!session) return;

  const current = normalizeChatSubject(session.subject);
  // Only auto-detect when the session is still "free" (or legacy keys normalized to free).
  if (current !== "free") return;

  const messagesCount = await countMessagesForSession(params.sessionId);
  if (messagesCount > AUTO_TITLE_INITIAL_WINDOW_MESSAGES) return;

  const ctx = await listRecentMessagesForSession({
    userId: params.userId,
    sessionId: params.sessionId,
    limit: AUTO_TITLE_CONTEXT_MESSAGES,
  });
  const history = ctx?.messages ?? [];

  let next: Subject | null = null;
  const aiText = await completeText({
    messages: [
      {
        role: "system",
        text:
          "Определи предмет диалога по переписке.\n" +
          "Верни строго одно значение из списка: free | math | russian | physics.\n" +
          "Если это не математика/физика/русский — верни free.\n" +
          "Ответ: только одно слово, без кавычек и точек.",
      },
      ...history.map((m) => ({ role: m.role, text: m.content })),
    ],
    maxTokens: 4,
    temperature: 0,
  });
  if (typeof aiText === "string") {
    const normalized = normalizeSubjectCandidate(aiText);
    if (normalized) next = normalizeChatSubject(normalized);
  }

  if (!next) {
    next = heuristicSubjectFromMessages(history);
  }

  // If we couldn't confidently map to a school subject, keep it free.
  if (next === "free") return;

  const db = getDb();
  await db
    .update(schema.chatSessions)
    .set({ subject: next })
    .where(and(eq(schema.chatSessions.id, params.sessionId), eq(schema.chatSessions.userId, params.userId)));
}

/** Удаляет сообщение с указанным id и все последующие в сессии. */
export async function deleteMessagesFrom(
  userId: number,
  sessionId: number,
  fromId: number,
): Promise<boolean> {
  const session = await getChatSession(userId, sessionId);
  if (!session) return false;

  const db = getDb();
  await db
    .delete(schema.messages)
    .where(and(eq(schema.messages.sessionId, sessionId), gte(schema.messages.id, fromId)));
  return true;
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

