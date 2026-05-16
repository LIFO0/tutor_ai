import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password"), // bcrypt hash; nullable for OAuth-only accounts
  name: text("name").notNull(),
  grade: integer("grade").notNull(), // 5..11
  avatar: text("avatar").notNull().default("bear1"),
  yandexId: text("yandex_id").unique(),
  /** Как обращаться к ученику в чате с ИИ; если пусто — используется name */
  chatName: text("chat_name"),
  plan: text("plan").notNull().default("free"), // free | plus
  planExpiresAt: text("plan_expires_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const usageDaily = sqliteTable(
  "usage_daily",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    date: text("date").notNull(), // YYYY-MM-DD, Europe/Moscow
    chatMessages: integer("chat_messages").notNull().default(0),
    taskGenerate: integer("task_generate").notNull().default(0),
    taskCheck: integer("task_check").notNull().default(0),
    chatSessions: integer("chat_sessions").notNull().default(0),
    estimatedTokens: integer("estimated_tokens").notNull().default(0),
  },
  (t) => [uniqueIndex("usage_daily_user_date_idx").on(t.userId, t.date)],
);

export const chatSessions = sqliteTable("chat_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  subject: text("subject").notNull(), // math | physics | russian | free (в БД могут быть старые mixed|general|creative)
  title: text("title"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => chatSessions.id),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const taskSessions = sqliteTable("task_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  taskText: text("task_text").notNull(),
  correct: integer("correct", { mode: "boolean" }), // null until checked
  userAnswer: text("user_answer"),
  correctAnswer: text("correct_answer"),
  aiFeedback: text("ai_feedback"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

