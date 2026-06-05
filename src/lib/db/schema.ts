import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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

/**
 * Банк переиспользуемых задач. Отделён от попытки ученика (task_sessions):
 * одна и та же задача может решаться разными учениками и передаваться по publicId.
 */
export const tasks = sqliteTable(
  "tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Шорт-код для обмена между учениками (то, что вводят, чтобы открыть чужую задачу). */
    publicId: text("public_id").notNull().unique(),
    subject: text("subject").notNull(), // math | physics | russian
    grade: integer("grade").notNull(), // 5..11
    /** Что ввёл ученик в поле «Тема». */
    rawTopic: text("raw_topic").notNull(),
    /** Канонический ключ темы (из словаря или детерминир. нормализации). */
    topicKey: text("topic_key").notNull(),
    /** Детерминированная нормализация rawTopic — для матчинга без ИИ. */
    topicNorm: text("topic_norm").notNull(),
    /** Короткий ярлык подтемы от ИИ (опц.). */
    subtopic: text("subtopic"),
    taskText: text("task_text").notNull(),
    correctAnswer: text("correct_answer").notNull(),
    /** sha256 нормализованного текста — exact-дедуп. */
    contentHash: text("content_hash").notNull().unique(),
    /** sha256 «скелета» (числа -> #) — дедуп задач одного типа. */
    templateHash: text("template_hash").notNull(),
    createdByUserId: integer("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("idx_tasks_subject_topic_grade").on(t.subject, t.topicKey, t.grade),
    index("idx_tasks_subject_topicnorm_grade").on(t.subject, t.topicNorm, t.grade),
    index("idx_tasks_subject_template_grade").on(t.subject, t.templateHash, t.grade),
  ],
);

export const taskSessions = sqliteTable(
  "task_sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    /** Ссылка на запись банка (nullable для совместимости со старыми строками). */
    taskId: integer("task_id").references(() => tasks.id),
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
  },
  (t) => [index("idx_task_sessions_user_task").on(t.userId, t.taskId)],
);

