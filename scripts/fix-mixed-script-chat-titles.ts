/**
 * Разовая починка названий чатов со смесью алфавитов в слове («Праfила …»).
 * По умолчанию только показывает, что поменяется (dry run). Запись — с флагом --apply.
 * Сначала проверьте вывод на копии БД; на проде запускать только осознанно.
 *
 *   DATABASE_PATH=/path/to/copy.db npx tsx scripts/fix-mixed-script-chat-titles.ts
 *   DATABASE_PATH=/path/to/copy.db npx tsx scripts/fix-mixed-script-chat-titles.ts --apply
 */
import Database from "better-sqlite3";
import { fixMixedScriptWords, sanitizeFallbackChatTitle } from "@/lib/chat-title";

function fallbackFromFirstUserMessage(sqlite: Database.Database, sessionId: number): string | null {
  const row = sqlite
    .prepare(
      `SELECT content FROM messages WHERE session_id = ? AND role = 'user'
       AND length(trim(content)) >= 4 ORDER BY id ASC LIMIT 1`,
    )
    .get(sessionId) as { content: string } | undefined;
  const t = row?.content.replace(/\s+/g, " ").trim().slice(0, 60).trim();
  return t ? sanitizeFallbackChatTitle(t) : null;
}

function main() {
  const dbPath = process.env.DATABASE_PATH;
  if (!dbPath) throw new Error("Set DATABASE_PATH explicitly (no default for this script).");
  const apply = process.argv.includes("--apply");
  const sqlite = new Database(dbPath, { readonly: !apply });

  const rows = sqlite
    .prepare(`SELECT id, title FROM chat_sessions WHERE title IS NOT NULL`)
    .all() as Array<{ id: number; title: string }>;

  const update = apply ? sqlite.prepare(`UPDATE chat_sessions SET title = ? WHERE id = ?`) : null;
  const changes: Array<{ id: number; from: string; to: string | null }> = [];
  for (const r of rows) {
    const { title, stillMixed } = fixMixedScriptWords(r.title);
    if (!stillMixed && title === r.title) continue;
    const to = stillMixed ? fallbackFromFirstUserMessage(sqlite, r.id) : title;
    changes.push({ id: r.id, from: r.title, to });
    update?.run(to, r.id);
  }

  console.log(JSON.stringify({ dbPath, apply, scanned: rows.length, changes }, null, 2));
}

main();
