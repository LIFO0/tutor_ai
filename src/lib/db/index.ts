import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { ensureTables } from "./bootstrap";

const dbPath = process.env.DATABASE_PATH ?? "./database.db";

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

