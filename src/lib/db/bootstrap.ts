import Database from "better-sqlite3";

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

function ensureUsageDailyTable(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS usage_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      chat_messages INTEGER NOT NULL DEFAULT 0,
      task_generate INTEGER NOT NULL DEFAULT 0,
      task_check INTEGER NOT NULL DEFAULT 0,
      chat_sessions INTEGER NOT NULL DEFAULT 0,
      estimated_tokens INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, date)
    );
    CREATE INDEX IF NOT EXISTS idx_usage_daily_user_date ON usage_daily(user_id, date);
  `);
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

