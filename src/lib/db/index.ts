import "server-only";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { ensureTables } from "./bootstrap";

function resolveDbPath() {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;

  // Keep SQLite *outside* the project so Next dev file-watching doesn't
  // rebuild endlessly when WAL/SHM files update.
  const base =
    process.env.LOCALAPPDATA ||
    process.env.APPDATA ||
    path.join(os.homedir(), "AppData", "Local");
  const dir = path.join(base, "tutor_ai");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "database.db");
}

const dbPath = resolveDbPath();

declare global {
  var __tutorDb: Database.Database | undefined;
  var __tutorDrizzle: ReturnType<typeof drizzle> | undefined;
}

function getSqlite() {
  if (!globalThis.__tutorDb) {
    globalThis.__tutorDb = new Database(dbPath);
    globalThis.__tutorDb.pragma("journal_mode = WAL");
    ensureTables(globalThis.__tutorDb);
  }
  return globalThis.__tutorDb;
}

export function getDb() {
  if (!globalThis.__tutorDrizzle) {
    globalThis.__tutorDrizzle = drizzle(getSqlite(), { schema });
  }
  return globalThis.__tutorDrizzle;
}

export { schema };

