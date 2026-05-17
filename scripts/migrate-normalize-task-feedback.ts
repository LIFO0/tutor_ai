import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, like } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { ensureTables } from "@/lib/db/bootstrap";
import { normalizeStoredTaskFeedback } from "@/lib/task-check-json";

function resolveDbPath() {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  const base =
    process.env.LOCALAPPDATA ||
    process.env.APPDATA ||
    path.join(os.homedir(), "AppData", "Local");
  const dir = path.join(base, "tutor_ai");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "database.db");
}

async function main() {
  const dbPath = resolveDbPath();
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  ensureTables(sqlite);
  const db = drizzle(sqlite, { schema });
  const rows = await db
    .select({
      id: schema.taskSessions.id,
      aiFeedback: schema.taskSessions.aiFeedback,
    })
    .from(schema.taskSessions)
    .where(like(schema.taskSessions.aiFeedback, '{%'));

  let updated = 0;
  for (const r of rows) {
    if (!r.aiFeedback) continue;
    const next = normalizeStoredTaskFeedback(r.aiFeedback);
    if (next === r.aiFeedback) continue;
    await db
      .update(schema.taskSessions)
      .set({ aiFeedback: next })
      .where(eq(schema.taskSessions.id, r.id));
    updated += 1;
  }

  console.log(JSON.stringify({ scanned: rows.length, updated, dbPath }, null, 2));
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
