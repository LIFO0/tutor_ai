import Database from "better-sqlite3";
import { contentHashOf, makePublicId, templateHashOf } from "@/lib/task-hash";
import { normalizeTopicText, resolveTopicKey } from "@/lib/task-topics";
import type { SchoolSubject } from "@/lib/subjects";
import { isSchoolSubject } from "@/lib/subjects";

function ensureUserColumns(sqlite: Database.Database) {
  const cols = sqlite.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  const has = (n: string) => cols.some((c) => c.name === n);
  if (!has("chat_name")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN chat_name TEXT");
  }
  if (!has("yandex_id")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN yandex_id TEXT");
    sqlite.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_yandex_id_unique ON users(yandex_id)");
  }
  if (!has("plan")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'");
  }
  if (!has("plan_expires_at")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN plan_expires_at TEXT");
  }
}

function ensureUsageDailyColumns(sqlite: Database.Database) {
  const cols = sqlite.prepare("PRAGMA table_info(usage_daily)").all() as { name: string }[];
  const has = (n: string) => cols.some((c) => c.name === n);
  if (!has("task_open")) {
    sqlite.exec("ALTER TABLE usage_daily ADD COLUMN task_open INTEGER NOT NULL DEFAULT 0");
  }
}

function ensureUsageDailyTable(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS usage_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      chat_messages INTEGER NOT NULL DEFAULT 0,
      task_generate INTEGER NOT NULL DEFAULT 0,
      task_check INTEGER NOT NULL DEFAULT 0,
      task_open INTEGER NOT NULL DEFAULT 0,
      chat_sessions INTEGER NOT NULL DEFAULT 0,
      estimated_tokens INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, date)
    );
    CREATE INDEX IF NOT EXISTS idx_usage_daily_user_date ON usage_daily(user_id, date);
  `);
  ensureUsageDailyColumns(sqlite);
}

function ensureTasksTable(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      subject TEXT NOT NULL,
      grade INTEGER NOT NULL,
      raw_topic TEXT NOT NULL,
      topic_key TEXT NOT NULL,
      topic_norm TEXT NOT NULL,
      subtopic TEXT,
      task_text TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      content_hash TEXT NOT NULL UNIQUE,
      template_hash TEXT NOT NULL,
      created_by_user_id INTEGER NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_subject_topic_grade ON tasks(subject, topic_key, grade);
    CREATE INDEX IF NOT EXISTS idx_tasks_subject_topicnorm_grade ON tasks(subject, topic_norm, grade);
    CREATE INDEX IF NOT EXISTS idx_tasks_subject_template_grade ON tasks(subject, template_hash, grade);
  `);
}

function ensureTaskSessionsColumns(sqlite: Database.Database) {
  const cols = sqlite.prepare("PRAGMA table_info(task_sessions)").all() as { name: string }[];
  const has = (n: string) => cols.some((c) => c.name === n);
  if (!has("task_id")) {
    sqlite.exec("ALTER TABLE task_sessions ADD COLUMN task_id INTEGER REFERENCES tasks(id)");
    sqlite.exec(
      "CREATE INDEX IF NOT EXISTS idx_task_sessions_user_task ON task_sessions(user_id, task_id)",
    );
  }
}

function insertUniquePublicId(
  sqlite: Database.Database,
  subject: SchoolSubject,
  params: {
    subject: string;
    grade: number;
    rawTopic: string;
    topicKey: string;
    topicNorm: string;
    taskText: string;
    correctAnswer: string;
    contentHash: string;
    templateHash: string;
    createdByUserId: number;
  },
): number | null {
  for (let attempt = 0; attempt < 8; attempt++) {
    const publicId = makePublicId(subject);
    try {
      const result = sqlite
        .prepare(
          `INSERT INTO tasks (
            public_id, subject, grade, raw_topic, topic_key, topic_norm,
            task_text, correct_answer, content_hash, template_hash, created_by_user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          publicId,
          params.subject,
          params.grade,
          params.rawTopic,
          params.topicKey,
          params.topicNorm,
          params.taskText,
          params.correctAnswer,
          params.contentHash,
          params.templateHash,
          params.createdByUserId,
        );
      return Number(result.lastInsertRowid);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("UNIQUE constraint failed: tasks.content_hash")) {
        const existing = sqlite
          .prepare("SELECT id FROM tasks WHERE content_hash = ? LIMIT 1")
          .get(params.contentHash) as { id: number } | undefined;
        return existing?.id ?? null;
      }
      if (msg.includes("UNIQUE constraint failed: tasks.public_id")) continue;
      throw e;
    }
  }
  return null;
}

function backfillTaskSessionsToBank(sqlite: Database.Database) {
  const rows = sqlite
    .prepare(
      `SELECT ts.id, ts.user_id, ts.subject, ts.topic, ts.task_text, ts.correct_answer, u.grade
       FROM task_sessions ts
       JOIN users u ON u.id = ts.user_id
       WHERE ts.task_id IS NULL`,
    )
    .all() as Array<{
    id: number;
    user_id: number;
    subject: string;
    topic: string;
    task_text: string;
    correct_answer: string | null;
    grade: number;
  }>;

  const findByHash = sqlite.prepare("SELECT id FROM tasks WHERE content_hash = ? LIMIT 1");
  const updateSession = sqlite.prepare("UPDATE task_sessions SET task_id = ? WHERE id = ?");

  for (const row of rows) {
    if (!isSchoolSubject(row.subject)) continue;

    const subject = row.subject;
    const rawTopic = row.topic;
    const topicNorm = normalizeTopicText(rawTopic);
    const { topicKey } = resolveTopicKey(subject, rawTopic);
    const taskText = row.task_text;
    const correctAnswer = row.correct_answer ?? "—";
    const cHash = contentHashOf(taskText);
    const tHash = templateHashOf(taskText);

    let bankId: number | null = null;
    const existing = findByHash.get(cHash) as { id: number } | undefined;
    if (existing) {
      bankId = existing.id;
    } else {
      bankId = insertUniquePublicId(sqlite, subject, {
        subject,
        grade: row.grade,
        rawTopic,
        topicKey,
        topicNorm,
        taskText,
        correctAnswer,
        contentHash: cHash,
        templateHash: tHash,
        createdByUserId: row.user_id,
      });
    }

    if (bankId) updateSession.run(bankId, row.id);
  }
}

export function ensureTables(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      grade INTEGER NOT NULL,
      avatar TEXT DEFAULT 'bear1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      subject TEXT NOT NULL,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES chat_sessions(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      task_text TEXT NOT NULL,
      correct BOOLEAN,
      user_answer TEXT,
      correct_answer TEXT,
      ai_feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  ensureUserColumns(sqlite);
  ensureUsageDailyTable(sqlite);
  ensureTasksTable(sqlite);
  ensureTaskSessionsColumns(sqlite);
  backfillTaskSessionsToBank(sqlite);

  // Performance indexes
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id_id
      ON chat_sessions(user_id, id);
    CREATE INDEX IF NOT EXISTS idx_messages_session_id_created_at
      ON messages(session_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_session_id_id
      ON messages(session_id, id);
  `);
}
