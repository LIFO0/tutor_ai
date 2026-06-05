import "server-only";

import { and, desc, eq, notInArray, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { contentHashOf, makePublicId, templateHashOf, taskTemplate } from "@/lib/task-hash";
import type { SchoolSubject } from "@/lib/subjects";
import { createTaskSession } from "@/lib/tasks";

export { contentHashOf, templateHashOf, taskTemplate } from "@/lib/task-hash";

/** Публичные поля банка — без correctAnswer (только server-side). */
export type BankTaskRow = {
  id: number;
  publicId: string;
  subject: string;
  grade: number;
  rawTopic: string;
  topicKey: string;
  topicNorm: string;
  subtopic: string | null;
  taskText: string;
  contentHash: string;
  templateHash: string;
};

/** Очистка скелета перед реинжектом в промпт (Unicode + только буквы/#/пробелы). */
export function sanitizeTemplateForPrompt(template: string): string {
  const normalized = template.normalize("NFKD").replace(/\p{M}/gu, "");
  return normalized
    .replace(/[^\p{L}#\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

async function getBankTaskCorrectAnswer(bankId: number): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({ correctAnswer: schema.tasks.correctAnswer })
    .from(schema.tasks)
    .where(eq(schema.tasks.id, bankId))
    .limit(1);
  return rows[0]?.correctAnswer ?? null;
}

/** Создать попытку ученика по задаче из банка (correctAnswer не покидает сервер). */
export async function createSessionFromBankTask(
  userId: number,
  bank: BankTaskRow,
): Promise<number | undefined> {
  const correctAnswer = await getBankTaskCorrectAnswer(bank.id);
  if (!correctAnswer) return undefined;

  return createTaskSession({
    userId,
    subject: bank.subject as SchoolSubject,
    topic: bank.rawTopic,
    taskText: bank.taskText,
    correctAnswer,
    taskId: bank.id,
  });
}

export async function upsertBankTask(params: {
  subject: SchoolSubject;
  grade: number;
  rawTopic: string;
  topicKey: string;
  topicNorm: string;
  subtopic?: string | null;
  taskText: string;
  correctAnswer: string;
  createdByUserId: number;
}): Promise<{ taskId: number; publicId: string; reused: boolean }> {
  const db = getDb();
  const cHash = contentHashOf(params.taskText);
  const tHash = templateHashOf(params.taskText);

  const existing = await db
    .select({
      id: schema.tasks.id,
      publicId: schema.tasks.publicId,
    })
    .from(schema.tasks)
    .where(eq(schema.tasks.contentHash, cHash))
    .limit(1);

  if (existing[0]) {
    return { taskId: existing[0].id, publicId: existing[0].publicId, reused: true };
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const publicId = makePublicId(params.subject);
    try {
      const rows = await db
        .insert(schema.tasks)
        .values({
          publicId,
          subject: params.subject,
          grade: params.grade,
          rawTopic: params.rawTopic,
          topicKey: params.topicKey,
          topicNorm: params.topicNorm,
          subtopic: params.subtopic ?? null,
          taskText: params.taskText,
          correctAnswer: params.correctAnswer,
          contentHash: cHash,
          templateHash: tHash,
          createdByUserId: params.createdByUserId,
        })
        .returning({ id: schema.tasks.id, publicId: schema.tasks.publicId });

      const row = rows[0];
      if (!row) throw new Error("Failed to insert bank task");
      return { taskId: row.id, publicId: row.publicId, reused: false };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("UNIQUE constraint failed: tasks.content_hash")) {
        const again = await db
          .select({ id: schema.tasks.id, publicId: schema.tasks.publicId })
          .from(schema.tasks)
          .where(eq(schema.tasks.contentHash, cHash))
          .limit(1);
        if (again[0]) {
          return { taskId: again[0].id, publicId: again[0].publicId, reused: true };
        }
      }
      if (msg.includes("UNIQUE constraint failed: tasks.public_id")) continue;
      throw e;
    }
  }

  throw new Error("Failed to allocate unique publicId");
}

export async function getTaskByPublicId(code: string): Promise<BankTaskRow | null> {
  const db = getDb();
  const normalized = code.trim().toUpperCase();
  const rows = await db
    .select({
      id: schema.tasks.id,
      publicId: schema.tasks.publicId,
      subject: schema.tasks.subject,
      grade: schema.tasks.grade,
      rawTopic: schema.tasks.rawTopic,
      topicKey: schema.tasks.topicKey,
      topicNorm: schema.tasks.topicNorm,
      subtopic: schema.tasks.subtopic,
      taskText: schema.tasks.taskText,
      contentHash: schema.tasks.contentHash,
      templateHash: schema.tasks.templateHash,
    })
    .from(schema.tasks)
    .where(eq(schema.tasks.publicId, normalized))
    .limit(1);

  return rows[0] ?? null;
}

/** templateHash задач, которые ученик уже решил верно. */
export async function solvedTemplateHashes(
  userId: number,
  subject: SchoolSubject,
  grade?: number,
): Promise<string[]> {
  const db = getDb();
  const conditions = [
    eq(schema.taskSessions.userId, userId),
    eq(schema.taskSessions.correct, true),
    eq(schema.tasks.subject, subject),
  ];
  if (grade != null) conditions.push(eq(schema.tasks.grade, grade));

  const rows = await db
    .select({ templateHash: schema.tasks.templateHash })
    .from(schema.taskSessions)
    .innerJoin(schema.tasks, eq(schema.taskSessions.taskId, schema.tasks.id))
    .where(and(...conditions));

  return [...new Set(rows.map((r) => r.templateHash))];
}

/** Последние решённые скелеты для подсказки в промпте. */
export async function recentSolvedTemplates(
  userId: number,
  subject: SchoolSubject,
  limit = 5,
): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ taskText: schema.tasks.taskText })
    .from(schema.taskSessions)
    .innerJoin(schema.tasks, eq(schema.taskSessions.taskId, schema.tasks.id))
    .where(
      and(
        eq(schema.taskSessions.userId, userId),
        eq(schema.taskSessions.correct, true),
        eq(schema.tasks.subject, subject),
      ),
    )
    .orderBy(desc(schema.taskSessions.id))
    .limit(limit);

  return rows
    .map((r) => sanitizeTemplateForPrompt(taskTemplate(r.taskText)))
    .filter((t) => t.length > 0);
}

export async function userSolvedTemplate(userId: number, templateHash: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: schema.taskSessions.id })
    .from(schema.taskSessions)
    .innerJoin(schema.tasks, eq(schema.taskSessions.taskId, schema.tasks.id))
    .where(
      and(
        eq(schema.taskSessions.userId, userId),
        eq(schema.taskSessions.correct, true),
        eq(schema.tasks.templateHash, templateHash),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

export async function findUnseenBankTask(
  userId: number,
  subject: SchoolSubject,
  topicKey: string,
  topicNorm: string,
  grade: number,
): Promise<BankTaskRow | null> {
  const db = getDb();
  const solved = await solvedTemplateHashes(userId, subject, grade);

  const topicMatch = or(
    eq(schema.tasks.topicKey, topicKey),
    eq(schema.tasks.topicNorm, topicNorm),
    eq(schema.tasks.topicKey, topicNorm),
  );

  const conditions = [
    eq(schema.tasks.subject, subject),
    eq(schema.tasks.grade, grade),
    topicMatch,
  ];
  if (solved.length > 0) {
    conditions.push(notInArray(schema.tasks.templateHash, solved));
  }
  const baseWhere = and(...conditions);

  const rows = await db
    .select({
      id: schema.tasks.id,
      publicId: schema.tasks.publicId,
      subject: schema.tasks.subject,
      grade: schema.tasks.grade,
      rawTopic: schema.tasks.rawTopic,
      topicKey: schema.tasks.topicKey,
      topicNorm: schema.tasks.topicNorm,
      subtopic: schema.tasks.subtopic,
      taskText: schema.tasks.taskText,
      contentHash: schema.tasks.contentHash,
      templateHash: schema.tasks.templateHash,
    })
    .from(schema.tasks)
    .where(baseWhere)
    .orderBy(sql`random()`)
    .limit(1);

  return rows[0] ?? null;
}

export async function openTaskByPublicId(
  userId: number,
  code: string,
): Promise<{ sessionId: number; publicId: string } | null> {
  const bank = await getTaskByPublicId(code);
  if (!bank) return null;

  const db = getDb();

  // Переиспользовать незавершённую попытку по этой задаче
  const openRows = await db
    .select({ id: schema.taskSessions.id })
    .from(schema.taskSessions)
    .where(
      and(
        eq(schema.taskSessions.userId, userId),
        eq(schema.taskSessions.taskId, bank.id),
        sql`${schema.taskSessions.correct} IS NULL`,
      ),
    )
    .orderBy(desc(schema.taskSessions.id))
    .limit(1);

  if (openRows[0]) {
    return { sessionId: openRows[0].id, publicId: bank.publicId };
  }

  const sessionId = await createSessionFromBankTask(userId, bank);
  if (!sessionId) return null;
  return { sessionId, publicId: bank.publicId };
}
