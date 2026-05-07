import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, like } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { ensureTables } from "@/lib/db/bootstrap";
import { normalizeMathMessageForModel } from "@/lib/math-prompt";

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
    .select({ id: schema.messages.id, content: schema.messages.content })
    .from(schema.messages)
    .where(like(schema.messages.content, "%\\\\placeholder%"));

  let updated = 0;
  for (const r of rows) {
    const next = normalizeMathMessageForModel(r.content);
    if (next === r.content) continue;
    await db.update(schema.messages).set({ content: next }).where(eq(schema.messages.id, r.id));
    updated += 1;
  }

  console.log(JSON.stringify({ scanned: rows.length, updated }, null, 2));
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

