import "server-only";

import { getSqlite } from "@/lib/db";
import { buildSnippet, type SnippetPart } from "@/lib/chat-search-query";

export type ChatSearchResult = {
  sessionId: number;
  title: string | null;
  subject: string;
  /** Matched message id (null when only the title matched). */
  messageId: number | null;
  role: "user" | "assistant" | null;
  snippet: SnippetPart[] | null;
  titleMatch: boolean;
};

/** Search current user's chats by title and message text. `foldedQuery` from normalizeSearchQuery. */
export function searchChats(userId: number, foldedQuery: string, limit = 30): ChatSearchResult[] {
  const sqlite = getSqlite();

  const titleRows = sqlite
    .prepare(
      `SELECT id, title, subject FROM chat_sessions
       WHERE user_id = ? AND title IS NOT NULL AND instr(ru_fold(title), ?) > 0
       ORDER BY id DESC LIMIT ?`,
    )
    .all(userId, foldedQuery, limit) as { id: number; title: string | null; subject: string }[];

  // Latest matching message per session.
  const msgRows = sqlite
    .prepare(
      `SELECT s.id AS sessionId, s.title AS title, s.subject AS subject,
              m.id AS messageId, m.role AS role, m.content AS content
       FROM messages m
       JOIN chat_sessions s ON s.id = m.session_id
       WHERE s.user_id = ? AND instr(ru_fold(m.content), ?) > 0
         AND m.id = (
           SELECT max(m2.id) FROM messages m2
           WHERE m2.session_id = m.session_id AND instr(ru_fold(m2.content), ?) > 0
         )
       ORDER BY m.id DESC LIMIT ?`,
    )
    .all(userId, foldedQuery, foldedQuery, limit) as {
    sessionId: number;
    title: string | null;
    subject: string;
    messageId: number;
    role: "user" | "assistant";
    content: string;
  }[];

  const bySession = new Map<number, ChatSearchResult>();
  for (const r of titleRows) {
    bySession.set(r.id, {
      sessionId: r.id,
      title: r.title,
      subject: r.subject,
      messageId: null,
      role: null,
      snippet: null,
      titleMatch: true,
    });
  }
  for (const r of msgRows) {
    const prev = bySession.get(r.sessionId);
    const snippet = buildSnippet(r.content, foldedQuery);
    if (prev) {
      prev.messageId = r.messageId;
      prev.role = r.role;
      prev.snippet = snippet;
    } else {
      bySession.set(r.sessionId, {
        sessionId: r.sessionId,
        title: r.title,
        subject: r.subject,
        messageId: r.messageId,
        role: r.role,
        snippet,
        titleMatch: false,
      });
    }
  }
  return [...bySession.values()].slice(0, limit);
}
