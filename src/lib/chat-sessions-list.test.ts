import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { ensureTables } from "@/lib/db/bootstrap";
import * as schema from "@/lib/db/schema";

const sqlite = new Database(":memory:");
ensureTables(sqlite);
const testDb = drizzle(sqlite, { schema });

vi.mock("@/lib/db", () => ({
  getDb: () => testDb,
  schema,
}));

const { listChatSessions } = await import("@/lib/chat");

describe("listChatSessions", () => {
  const userId = 1;
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
  const justNow = new Date().toISOString();

  beforeAll(() => {
    sqlite.exec(`
      INSERT INTO users (id, email, password, name, grade) VALUES (1, 't@test.ru', 'x', 'Test', 5);
      INSERT INTO chat_sessions (id, user_id, subject, title, created_at) VALUES
        (1, 1, 'math', 'Old chat', '${eightDaysAgo}'),
        (2, 1, 'math', 'New chat', '${justNow}');
      INSERT INTO messages (session_id, role, content, created_at) VALUES
        (1, 'user', 'old', '${eightDaysAgo}'),
        (2, 'user', 'new', '${justNow}');
    `);
  });

  afterAll(() => {
    sqlite.close();
  });

  test("returns per-session lastMessageAt, not a global max", async () => {
    const sessions = await listChatSessions(userId);
    const oldChat = sessions.find((s) => s.id === 1);
    const newChat = sessions.find((s) => s.id === 2);

    expect(oldChat?.lastMessageAt).toBe(eightDaysAgo);
    expect(newChat?.lastMessageAt).toBe(justNow);
    expect(oldChat?.lastMessageAt).not.toBe(newChat?.lastMessageAt);
  });

  test("orders by recent activity (new chat first)", async () => {
    const sessions = await listChatSessions(userId);
    expect(sessions[0]?.id).toBe(2);
    expect(sessions[1]?.id).toBe(1);
  });
});
